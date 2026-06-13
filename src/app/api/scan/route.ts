import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { EnvironmentalDB } from "@/services/environmental-db";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { z } from "zod";

const apiKey = process.env.GEMINI_API_KEY;

// Zod Schema to validate incoming scan requests
const scanRequestSchema = z.object({
  imageBase64: z.string().min(1),
  filename: z.string().optional(),
});

/**
 * Checks if Gemini API Key is configured.
 */
const isGeminiConfigured = (): boolean => {
  return !!(apiKey && apiKey !== "your-gemini-api-key");
};

// Load service account credentials for Google Cloud Vision API
let serviceAccount: { client_email?: string; private_key?: string } | null = null;
try {
  if (process.env.GOOGLE_SERVICE_ACCOUNT_JSON) {
    serviceAccount = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    const credsPath = path.isAbsolute(process.env.GOOGLE_APPLICATION_CREDENTIALS)
      ? process.env.GOOGLE_APPLICATION_CREDENTIALS
      : path.join(
          /*turbopackIgnore: true*/ process.cwd(),
          process.env.GOOGLE_APPLICATION_CREDENTIALS
        );
    if (fs.existsSync(credsPath)) {
      serviceAccount = JSON.parse(fs.readFileSync(credsPath, "utf8"));
    }
  }

  if (!serviceAccount) {
    const defaultPath = path.join(
      /*turbopackIgnore: true*/ process.cwd(),
      "gmp-demo-project-064136245-618edbf4f9af.json"
    );
    if (fs.existsSync(defaultPath)) {
      serviceAccount = JSON.parse(fs.readFileSync(defaultPath, "utf8"));
    }
  }
} catch (e) {
  console.error("Failed to load Google credentials:", e);
}

export const isGoogleVisionConfigured = (): boolean => {
  return !!(serviceAccount && serviceAccount.private_key && serviceAccount.client_email);
};

export async function getGoogleAccessToken(sa: {
  client_email: string;
  private_key: string;
}): Promise<string> {
  const header = {
    alg: "RS256",
    typ: "JWT",
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/cloud-platform",
    aud: "https://oauth2.googleapis.com/token",
    exp: now + 3600,
    iat: now,
  };

  const base64UrlEncode = (obj: unknown) => {
    return Buffer.from(JSON.stringify(obj))
      .toString("base64")
      .replace(/=/g, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  };

  const tokenInput = `${base64UrlEncode(header)}.${base64UrlEncode(payload)}`;

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(tokenInput);

  const privateKey = sa.private_key.replace(/\\n/g, "\n");
  const signature = signer
    .sign(privateKey, "base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const jwt = `${tokenInput}.${signature}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!tokenRes.ok) {
    const errorText = await tokenRes.text();
    throw new Error(`Failed to exchange JWT for Google access token: ${errorText}`);
  }

  const tokenData = await tokenRes.json();
  return tokenData.access_token;
}

export async function callGoogleVision(base64Data: string, accessToken: string) {
  const res = await fetch("https://vision.googleapis.com/v1/images:annotate", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      requests: [
        {
          image: {
            content: base64Data,
          },
          features: [
            {
              type: "TEXT_DETECTION",
            },
            {
              type: "LABEL_DETECTION",
            },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Google Cloud Vision API request failed: ${errorText}`);
  }

  return res.json();
}

export function heuristicParseOCR(ocrText: string) {
  const ocrLower = ocrText.toLowerCase();
  let category: "diet" | "energy" | "transport" | "waste" = "diet";
  let summaryDescription = "Scanned Item (OCR parse)";

  if (
    ocrLower.includes("bill") ||
    ocrLower.includes("electric") ||
    ocrLower.includes("power") ||
    ocrLower.includes("kwh")
  ) {
    category = "energy";
    summaryDescription = "Utility Bill (OCR)";
  } else if (
    ocrLower.includes("receipt") ||
    ocrLower.includes("store") ||
    ocrLower.includes("supermarket")
  ) {
    category = "waste";
    summaryDescription = "Shopping Receipt (OCR)";
  }

  const numberPattern = /(\d+(?:\.\d+)?)\s*(kwh|g|lbs|pcs)?/gi;
  const items = [];
  let match;
  let count = 0;

  while ((match = numberPattern.exec(ocrText)) !== null && count < 5) {
    const val = parseFloat(match[1]);
    const unit = (match[2] || "pcs").toLowerCase();
    items.push({
      name: `OCR Item ${count + 1}`,
      rawQuantity: match[0],
      value: val,
      unit: unit === "kwh" || unit === "g" || unit === "lbs" || unit === "pcs" ? unit : "unknown",
    });
    count++;
  }

  if (items.length === 0) {
    items.push({
      name: "Scanned Item",
      rawQuantity: "1 unit",
      value: 1,
      unit: "pcs",
    });
  }

  return {
    scannedType: category,
    summaryDescription,
    items,
    suggestedAlternatives: [
      {
        name: "Eco alternative",
        description: "Choose reusable packaging and conserve resource usages.",
      },
    ],
  };
}

export async function POST(req: Request) {
  try {
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const validationResult = scanRequestSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { imageBase64, filename } = validationResult.data;

    // ─── Server-side input validation ────────────────────────────────────────
    // 1. Size guard — base64 of a 5 MB file is ~6.8 million chars
    const MAX_BASE64_CHARS = 7_000_000;
    if (imageBase64.length > MAX_BASE64_CHARS) {
      return NextResponse.json({ error: "Image payload exceeds the 5 MB limit" }, { status: 413 });
    }

    // 2. MIME type allowlist — prevents processing of arbitrary file types
    const ALLOWED_MIME_TYPES = new Set([
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
      "image/gif",
    ]);

    const mimeMatch = imageBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9\-.+]+);base64,/);
    if (!mimeMatch) {
      return NextResponse.json({ error: "Invalid image data URI format" }, { status: 400 });
    }

    const mimeType = mimeMatch[1].toLowerCase();
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return NextResponse.json(
        { error: `Unsupported image type '${mimeType}'. Allowed: png, jpeg, webp, gif` },
        { status: 415 }
      );
    }

    // 3. Sanitize filename — strip path traversal and limit length
    const rawFilename: string = typeof filename === "string" ? filename : "upload";
    const safeFilename = rawFilename
      .replace(/[/\\?%*:|"<>]/g, "_") // strip path/shell special chars
      .replace(/\.\./g, "_") // prevent directory traversal
      .slice(0, 255);

    // ─── End validation ───────────────────────────────────────────────────────

    // Convert base64 data to GoogleGenerativeAI format
    const matches = imageBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return NextResponse.json({ error: "Invalid image format" }, { status: 400 });
    }

    const base64Data = matches[2];

    // Helper function for local mock scans
    const getLocalMockResult = (fname: string) => {
      const nameLower = (fname || "").toLowerCase();
      let res = {
        category: "diet",
        description: "Organic Veggie Plate with Quinoa & Salad",
        co2Emission: 0.35,
        carbonOffset: 1.45,
        sustainabilityScore: 88,
        xpEarned: 100,
        datasetExplain:
          "Open Food Facts & Agribalyse environmental values for plant-based dishes. (Local Fallback)",
        confidence: 92,
        alternatives: [
          {
            name: "Locally sourced garden salad",
            carbonSaving: 0.1,
            description: "Decreases shipping carbon mileage.",
          },
          {
            name: "Raw vegan smoothie meal",
            carbonSaving: 0.15,
            description: "Eliminates cooking energy emissions.",
          },
          {
            name: "Homegrown kitchen herbs topping",
            carbonSaving: 0.05,
            description: "Zero waste and zero packaging transport footprint.",
          },
        ],
        isMock: true,
      };

      if (
        nameLower.includes("bill") ||
        nameLower.includes("utility") ||
        nameLower.includes("electric") ||
        nameLower.includes("power")
      ) {
        res = {
          category: "energy",
          description: "Monthly Residential Electric Bill",
          co2Emission: 112.5,
          carbonOffset: -22.4,
          sustainabilityScore: 45,
          xpEarned: 50,
          datasetExplain: "US Grid EPA eGRID regional carbon intensity models. (Local Fallback)",
          confidence: 85,
          alternatives: [
            {
              name: "LED bulb retrofitting",
              carbonSaving: 8.5,
              description: "Cuts lighting electricity demand by 80%.",
            },
            {
              name: "Smart thermostat installation",
              carbonSaving: 14.0,
              description: "Optimizes cooling schedules based on occupancy.",
            },
            {
              name: "Green power supplier plan",
              carbonSaving: 112.5,
              description: "Transitioning utility billing to 100% renewable credits.",
            },
          ],
          isMock: true,
        };
      } else if (
        nameLower.includes("receipt") ||
        nameLower.includes("store") ||
        nameLower.includes("target") ||
        nameLower.includes("walmart")
      ) {
        res = {
          category: "waste",
          description: "Grocery Receipt with Single-Use Plastic Wrap Items",
          co2Emission: 4.8,
          carbonOffset: -1.2,
          sustainabilityScore: 58,
          xpEarned: 80,
          datasetExplain:
            "Ecoinvent life-cycle assessments (LCA) for consumer goods packaging. (Local Fallback)",
          confidence: 88,
          alternatives: [
            {
              name: "Buying bulk zero-wrap items",
              carbonSaving: 1.1,
              description: "Avoids pre-packaged plastic packaging trays.",
            },
            {
              name: "Reusable silicone storage bags",
              carbonSaving: 0.9,
              description: "Replaces disposable bags over 300+ use cycles.",
            },
            {
              name: "Composting organic scraps",
              carbonSaving: 1.5,
              description: "Prevents anaerobic landfill methane leakage.",
            },
          ],
          isMock: true,
        };
      }
      return res;
    };

    // 1. FALLBACK LOCAL MOCK SCANNING
    if (!isGeminiConfigured() && !isGoogleVisionConfigured()) {
      return NextResponse.json(getLocalMockResult(filename || ""));
    }

    let parsedData = null;
    let usedGoogleVision = false;

    if (isGoogleVisionConfigured()) {
      try {
        const accessToken = await getGoogleAccessToken(
          serviceAccount as { client_email: string; private_key: string }
        );
        const visionResult = await callGoogleVision(base64Data, accessToken);

        const ocrText = visionResult.responses?.[0]?.textAnnotations?.[0]?.description || "";
        const labelObjs = visionResult.responses?.[0]?.labelAnnotations || [];
        const labels = labelObjs.map((l: { description: string }) => l.description);

        if (ocrText.trim().length > 0) {
          usedGoogleVision = true;

          if (isGeminiConfigured()) {
            const genAI = new GoogleGenerativeAI(apiKey!);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            const textPrompt = `Analyze the following OCR text and labels extracted from an uploaded image (e.g., utility bill, shopping receipt, meal, grocery product, or label).
Extract details as a structured JSON object representing the individual line items or utility counts.

OCR Text:
${ocrText}

Visual Labels:
${labels.join(", ")}

Format your output strictly as a JSON object matching this structure:
{
  "scannedType": "diet" | "energy" | "transport" | "waste",
  "summaryDescription": string, (e.g., "Organic Food Grocery Bill", "Monthly Electricity Statement")
  "items": [
    {
      "name": string, (e.g., "Electricity Usage", "Beef Steak", "Cardboard Box")
      "rawQuantity": string, (e.g., "300 kWh", "500g", "1.5 lbs", "1 unit")
      "value": number, (numeric quantity value, e.g. 300, 500, 1.5, 1)
      "unit": "kwh" | "g" | "lbs" | "pcs" | "unknown",
      "barcode": string (optional, if barcode numbers are visible on packaging/receipt)
    }
  ],
  "suggestedAlternatives": [
    { "name": string, "description": string }
  ]
}

Do not wrap the response in markdown blocks or write any other text, just output raw valid JSON.`;

            const result = await model.generateContent(textPrompt);
            const text = result.response.text();

            const jsonStr = text
              .replace(/```json/g, "")
              .replace(/```/g, "")
              .trim();
            parsedData = JSON.parse(jsonStr);
          } else {
            parsedData = heuristicParseOCR(ocrText);
          }
        }
      } catch (e) {
        console.error("Google Cloud Vision pipeline failed, falling back to Gemini Vision:", e);
      }
    }

    if (!parsedData) {
      if (!isGeminiConfigured()) {
        return NextResponse.json(getLocalMockResult(safeFilename));
      }

      const genAI = new GoogleGenerativeAI(apiKey!);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `Analyze this image (utility bill, shopping receipt, meal, grocery product, or label).
      Extract details as a structured JSON object representing the individual line items or utility counts.
      
      Format your output strictly as a JSON object matching this structure:
      {
        "scannedType": "diet" | "energy" | "transport" | "waste",
        "summaryDescription": string, (e.g., "Organic Food Grocery Bill", "Monthly Electricity Statement")
        "items": [
          {
            "name": string, (e.g., "Electricity Usage", "Beef Steak", "Cardboard Box")
            "rawQuantity": string, (e.g., "300 kWh", "500g", "1.5 lbs", "1 unit")
            "value": number, (numeric quantity value, e.g. 300, 500, 1.5, 1)
            "unit": "kwh" | "g" | "lbs" | "pcs" | "unknown",
            "barcode": string (optional, if barcode numbers are visible on packaging/receipt)
          }
        ],
        "suggestedAlternatives": [
          { "name": string, "description": string }
        ]
      }
      
      Do not wrap the response in markdown blocks or write any other text, just output raw valid JSON.`;

      const imagePart = {
        inlineData: {
          data: base64Data,
          mimeType,
        },
      };

      const result = await model.generateContent([prompt, imagePart]);
      const text = result.response.text();

      const jsonStr = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      parsedData = JSON.parse(jsonStr);
    }

    const scannedType = parsedData.scannedType || "diet";
    const summaryDescription = parsedData.summaryDescription || "Scanned Item Analysis";
    const items = parsedData.items || [];

    // 3. REAL DATA PIPELINE: Run lookups and calculations deterministically
    let totalCO2 = 0;
    let totalScore = 0;
    let matchCount = 0;
    const datasetSources: string[] = [];

    for (const item of items) {
      const { name, value, unit, barcode } = item;

      if (scannedType === "energy") {
        // Resolve utility type from item name
        const lowerName = name.toLowerCase();
        const type = lowerName.includes("gas")
          ? "gas"
          : lowerName.includes("water")
            ? "water"
            : "electricity";

        const calculation = EnvironmentalDB.calculateUtilityEmissions(value || 0, type);
        totalCO2 += calculation.co2PerUnit * (value || 0);
        totalScore += calculation.sustainabilityScore;
        datasetSources.push(calculation.source);
        matchCount++;
      } else if (scannedType === "diet" || scannedType === "waste") {
        let matchedItem = null;

        // Try Open Food Facts by barcode or query
        if (barcode) {
          matchedItem = await EnvironmentalDB.searchOpenFoodFacts(barcode);
        } else if (name) {
          matchedItem = await EnvironmentalDB.searchOpenFoodFacts(name);
        }

        // Fallback to Agribalyse ingredient database
        if (!matchedItem && name) {
          matchedItem = EnvironmentalDB.lookupAgribalyse(name);
        }

        if (matchedItem) {
          // Convert quantity to weight in kg
          let weightKg = 0.2; // Default 200g
          if (unit === "g") {
            weightKg = value / 1000;
          } else if (unit === "lbs") {
            weightKg = value * 0.453592; // lbs to kg
          } else if (value && value > 0) {
            weightKg = value;
          }

          totalCO2 += matchedItem.co2PerUnit * weightKg;
          totalScore += matchedItem.sustainabilityScore;
          datasetSources.push(matchedItem.source);
          matchCount++;
        }
      }
    }

    // Default calculations if no items matched
    if (matchCount === 0) {
      totalCO2 = scannedType === "energy" ? 85.0 : 2.5;
      totalScore = 60;
      datasetSources.push("Generic Environmental Averages");
    } else {
      totalScore = Math.round(totalScore / matchCount);
    }

    // 4. Calculate Carbon Offsets deterministically
    let calculatedOffset = 0;
    if (scannedType === "diet") {
      calculatedOffset =
        totalScore > 70
          ? parseFloat((totalCO2 * 2.5).toFixed(2))
          : parseFloat((-totalCO2 * 0.5).toFixed(2));
    } else if (scannedType === "energy") {
      calculatedOffset =
        totalScore > 60
          ? parseFloat((totalCO2 * 0.12).toFixed(2))
          : parseFloat((-totalCO2 * 0.1).toFixed(2));
    } else if (scannedType === "waste") {
      calculatedOffset = totalScore > 65 ? 1.2 : -0.5;
    } else {
      calculatedOffset = 1.5;
    }

    // Format dataset references
    const uniqueSources = Array.from(new Set(datasetSources));
    const datasetExplain = `Validated via: ${uniqueSources.join(" | ")}.`;

    // Map suggested alternatives and attach carbon savings deterministically
    const rawAlternatives = parsedData.suggestedAlternatives || [];
    const formattedAlternatives = rawAlternatives
      .slice(0, 3)
      .map((alt: { name: string; description?: string }, idx: number) => {
        let saving = 0.5;
        if (scannedType === "energy") saving = (idx + 1) * 4.2;
        else if (scannedType === "diet") saving = (idx + 1) * 0.45;
        else if (scannedType === "transport") saving = (idx + 1) * 1.5;
        else if (scannedType === "waste") saving = (idx + 1) * 0.3;

        return {
          name: alt.name,
          carbonSaving: parseFloat(saving.toFixed(2)),
          description: alt.description || "Greener alternative to reduce carbon accumulation.",
        };
      });

    // Determine XP earned
    const xpEarned = Math.min(150, Math.max(30, Math.round(totalScore * 1.2)));

    return NextResponse.json({
      category: scannedType,
      description: summaryDescription,
      co2Emission: parseFloat(totalCO2.toFixed(2)),
      carbonOffset: calculatedOffset,
      sustainabilityScore: totalScore,
      xpEarned,
      datasetExplain,
      confidence: 90,
      alternatives: formattedAlternatives,
      isMock: false,
      usedGoogleVision,
    });
  } catch (error) {
    console.error("Gemini Vision Custom Pipeline Error:", error);

    const errMsg = error instanceof Error ? error.message : String(error);
    if (
      errMsg.includes("503") ||
      errMsg.includes("high demand") ||
      errMsg.includes("429") ||
      errMsg.includes("quota") ||
      errMsg.includes("limit")
    ) {
      return NextResponse.json(
        {
          error:
            "The AI model is experiencing high demand or has reached its rate limits. Please try again in a few minutes.",
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        error:
          "Scan pipeline failed: " + (error instanceof Error ? error.message : "Unknown error"),
      },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { EnvironmentalDB } from "@/services/environmental-db";

const apiKey = process.env.GEMINI_API_KEY;

const isGeminiConfigured = (): boolean => {
  return !!(apiKey && apiKey !== "your-gemini-api-key");
};

export async function POST(req: Request) {
  try {
    const { imageBase64, filename } = await req.json();

    if (!imageBase64) {
      return NextResponse.json({ error: "Image data is required" }, { status: 400 });
    }

    // Convert base64 data to GoogleGenerativeAI format
    const matches = imageBase64.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return NextResponse.json({ error: "Invalid image format" }, { status: 400 });
    }

    const mimeType = matches[1];
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
        datasetExplain: "Open Food Facts & Agribalyse environmental values for plant-based dishes. (Local Fallback)",
        confidence: 92,
        alternatives: [
          { name: "Locally sourced garden salad", carbonSaving: 0.1, description: "Decreases shipping carbon mileage." },
          { name: "Raw vegan smoothie meal", carbonSaving: 0.15, description: "Eliminates cooking energy emissions." },
          { name: "Homegrown kitchen herbs topping", carbonSaving: 0.05, description: "Zero waste and zero packaging transport footprint." }
        ],
        isMock: true
      };

      if (nameLower.includes("bill") || nameLower.includes("utility") || nameLower.includes("electric") || nameLower.includes("power")) {
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
            { name: "LED bulb retrofitting", carbonSaving: 8.5, description: "Cuts lighting electricity demand by 80%." },
            { name: "Smart thermostat installation", carbonSaving: 14.0, description: "Optimizes cooling schedules based on occupancy." },
            { name: "Green power supplier plan", carbonSaving: 112.5, description: "Transitioning utility billing to 100% renewable credits." }
          ],
          isMock: true
        };
      } else if (nameLower.includes("receipt") || nameLower.includes("store") || nameLower.includes("target") || nameLower.includes("walmart")) {
        res = {
          category: "waste",
          description: "Grocery Receipt with Single-Use Plastic Wrap Items",
          co2Emission: 4.8,
          carbonOffset: -1.2,
          sustainabilityScore: 58,
          xpEarned: 80,
          datasetExplain: "Ecoinvent life-cycle assessments (LCA) for consumer goods packaging. (Local Fallback)",
          confidence: 88,
          alternatives: [
            { name: "Buying bulk zero-wrap items", carbonSaving: 1.1, description: "Avoids pre-packaged plastic packaging trays." },
            { name: "Reusable silicone storage bags", carbonSaving: 0.9, description: "Replaces disposable bags over 300+ use cycles." },
            { name: "Composting organic scraps", carbonSaving: 1.5, description: "Prevents anaerobic landfill methane leakage." }
          ],
          isMock: true
        };
      }
      return res;
    };

    // 1. FALLBACK LOCAL MOCK SCANNING
    if (!isGeminiConfigured()) {
      return NextResponse.json(getLocalMockResult(filename));
    }

    // 2. REAL AI SCANNING: Call Gemini Vision for OCR parsing & Item extraction
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
        mimeType
      }
    };

    const result = await model.generateContent([prompt, imagePart]);
    const text = result.response.text();
    
    // Parse JSON safely
    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsedData = JSON.parse(jsonStr);

    const scannedType = parsedData.scannedType || "diet";
    const summaryDescription = parsedData.summaryDescription || "Scanned Item Analysis";
    const items = parsedData.items || [];
    
    // 3. REAL DATA PIPELINE: Run lookups and calculations deterministically
    let totalCO2 = 0;
    let totalScore = 0;
    let matchCount = 0;
    let datasetSources: string[] = [];

    for (const item of items) {
      const { name, value, unit, barcode } = item;

      if (scannedType === "energy") {
        // Resolve utility type from item name
        const lowerName = name.toLowerCase();
        const type = lowerName.includes("gas") ? "gas" : lowerName.includes("water") ? "water" : "electricity";
        
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
      calculatedOffset = totalScore > 70 ? parseFloat((totalCO2 * 2.5).toFixed(2)) : parseFloat((-totalCO2 * 0.5).toFixed(2));
    } else if (scannedType === "energy") {
      calculatedOffset = totalScore > 60 ? parseFloat((totalCO2 * 0.12).toFixed(2)) : parseFloat((-totalCO2 * 0.1).toFixed(2));
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
    const formattedAlternatives = rawAlternatives.slice(0, 3).map((alt: any, idx: number) => {
      let saving = 0.5;
      if (scannedType === "energy") saving = (idx + 1) * 4.2;
      else if (scannedType === "diet") saving = (idx + 1) * 0.45;
      else if (scannedType === "transport") saving = (idx + 1) * 1.5;
      else if (scannedType === "waste") saving = (idx + 1) * 0.3;

      return {
        name: alt.name,
        carbonSaving: parseFloat(saving.toFixed(2)),
        description: alt.description || "Greener alternative to reduce carbon accumulation."
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
      isMock: false
    });
  } catch (error: any) {
    console.error("Gemini Vision Custom Pipeline Error:", error);
    
    const errMsg = error?.message || "";
    if (
      errMsg.includes("503") ||
      errMsg.includes("high demand") ||
      errMsg.includes("429") ||
      errMsg.includes("quota") ||
      errMsg.includes("limit")
    ) {
      return NextResponse.json(
        { error: "The AI model is experiencing high demand or has reached its rate limits. Please try again in a few minutes." },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: "Scan pipeline failed: " + error.message },
      { status: 500 }
    );
  }
}

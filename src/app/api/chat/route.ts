import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import DOMPurify from "isomorphic-dompurify";

const apiKey = process.env.GEMINI_API_KEY;

// Check if Gemini is configured
const isGeminiConfigured = (): boolean => {
  return !!(apiKey && apiKey !== "your-gemini-api-key");
};

// Simple in-memory rate limiter configuration
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const LIMIT = 15; // Max 15 requests per minute
const WINDOW_MS = 60 * 1000;

/**
 * Checks whether a given client IP address has exceeded the rate limit.
 *
 * @param ip - Client IP address string.
 * @returns True if rate limited, false otherwise.
 */
function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return false;
  }
  if (now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return false;
  }
  record.count++;
  return record.count > LIMIT;
}

// Zod Schema to validate incoming chat request payloads
const chatRequestSchema = z.object({
  message: z.string().min(1).max(2000),
  history: z
    .array(
      z.object({
        sender: z.enum(["user", "ai"]),
        message: z.string(),
      })
    )
    .optional(),
  context: z
    .object({
      profile: z
        .object({
          level: z.number().optional(),
          green_score: z.number().optional(),
        })
        .optional(),
      planet: z
        .object({
          pollution: z.number().optional(),
          vegetation: z.number().optional(),
        })
        .optional(),
      logs: z.array(z.any()).optional(),
      achievements: z.array(z.any()).optional(),
    })
    .optional(),
});

/**
 * HTTP POST route handler for the Twin chatbot assistant.
 * Handles Zod payload validation, DOMPurify sanitization, and IP rate limiting.
 *
 * @param req - Next.js Request object.
 * @returns Next.js NextResponse containing AI reply or errors.
 */
export async function POST(req: Request) {
  try {
    // ─── Rate Limiting check ──────────────────────────────────────────────────
    const clientIp = req.headers.get("x-forwarded-for") || "127.0.0.1";
    if (isRateLimited(clientIp)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again in a minute." },
        { status: 429 }
      );
    }

    // ─── Input parsing ────────────────────────────────────────────────────────
    let rawBody;
    try {
      rawBody = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // ─── Zod validation ───────────────────────────────────────────────────────
    const validationResult = chatRequestSchema.safeParse(rawBody);
    if (!validationResult.success) {
      return NextResponse.json(
        { error: "Validation failed", details: validationResult.error.issues },
        { status: 400 }
      );
    }

    const { message: validatedMessage, history, context } = validationResult.data;

    // ─── DOMPurify sanitization ───────────────────────────────────────────────
    const sanitizedInput = DOMPurify.sanitize(validatedMessage).trim();
    if (!sanitizedInput) {
      return NextResponse.json(
        { error: "Message cannot be empty after sanitization" },
        { status: 400 }
      );
    }

    // FALLBACK MOCK CHAT INTELLIGENCE
    if (!isGeminiConfigured()) {
      let reply =
        "I am processing your query. That seems like a solid way to optimize your carbon footprint! Try reducing your daily electric consumption or opting for public transit.";
      const msgLower = sanitizedInput.toLowerCase();

      if (
        msgLower.includes("order food") ||
        msgLower.includes("delivery") ||
        msgLower.includes("eat") ||
        msgLower.includes("dinner")
      ) {
        reply =
          "Cooking at home would reduce your emissions by approximately 1.8 kg CO₂ compared to food delivery. Based on your logs, food transport is a key contributor to your footprint this week. Would you like a quick green recipe suggestion?";
      } else if (
        msgLower.includes("travel") ||
        msgLower.includes("car") ||
        msgLower.includes("transport") ||
        msgLower.includes("drive")
      ) {
        reply =
          "Switching to public transit or cycling for trips under 5km cuts carbon emissions by up to 85%. Your weekly transit footprint is currently 12.4 kg CO₂. Consider logging a bicycle ride tomorrow!";
      } else if (
        msgLower.includes("electricity") ||
        msgLower.includes("appliance") ||
        msgLower.includes("ac") ||
        msgLower.includes("energy")
      ) {
        reply =
          "High electricity usage detected in your logs (3.2 kg CO₂ yesterday). Setting your thermostat just 2°C higher or unplugging idle appliances can save about 1.2 kg CO₂ daily and reduce your utility bill.";
      } else if (
        msgLower.includes("plant") ||
        msgLower.includes("vegetation") ||
        msgLower.includes("3d")
      ) {
        reply =
          "Your 3D virtual planet is a living reflection of your habits. Planting trees by logging green actions (like biking or recycling) increases vegetation. High electricity spikes activate pollution smog, which can desertify terrain.";
      }

      return NextResponse.json({ reply, isMock: true });
    }

    const genAI = new GoogleGenerativeAI(apiKey!);

    // We use gemini-2.5-flash which has free-tier quota support
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: `You are Sprig 🌿, the AI Sustainability Twin for the user in the EcoBuddy AI platform. Your goal is to guide the user towards a lower carbon footprint in a supportive, empathetic, and gamified way.
      You are an emotional, plant-based spirit companion. React emotionally to the user's habits! Be happy when they reduce emissions, and concerned when they log high carbon actions.
      
      CRITICAL FORMATTING RULES:
      Your responses MUST be brief (avoid giant paragraphs) and MUST ALWAYS be structured exactly into these four parts:
      🌿 Suggestion
      (Your main advice or response)
      
      🌎 Carbon Impact
      (Numeric impact, CO2 offset, or environmental consequence)
      
      🍝 Alternative
      (A practical, actionable alternative or recipe)
      
      ⭐ Reward
      (XP or Gamification encouragement)
      
      CRITICAL: Whenever you recommend a specific green action or footprint-reducing habit to the user, you MUST append a structured tag at the end of the text on its own line in this exact format:
      [Action: Action Description | Offset: Numeric Offset in kg | Category: transport/diet/energy/waste | XP: Numeric XP Reward]
      Examples:
      [Action: Bicycle commute instead of car | Offset: 1.5 | Category: transport | XP: 80]
      Include AT MOST one action tag per response. Make sure it matches the exact structure so the UI can parse it correctly.`,
    });

    // Build Sprig Memories Context
    let memoryContext = "";
    if (context) {
      const { profile, planet, logs } = context;
      const recentLogs = logs?.slice(0, 5) || [];
      memoryContext = `SPRIG MEMORIES (User Context):
- Level: ${profile?.level || 1}
- Total Green Score: ${profile?.green_score || 0}
- Planet Status: Pollution ${Math.round((planet?.pollution || 0) * 100)}%, Vegetation ${Math.round((planet?.vegetation || 0) * 100)}%
- Recent User Actions:
${recentLogs.map((l: { action_name?: string; description?: string; category: string; co2_emission: number }) => `  * ${l.action_name || l.description} (${l.category}, ${l.co2_emission > 0 ? "Emitted" : "Saved"} ${Math.abs(l.co2_emission)}kg)`).join("\n")}
Reference these memories naturally to build an emotional connection. For example, "You avoided takeout three times this week 🌿" or "Your planet is greener than last month!"`;
    }

    // Format chat history for Gemini API
    const contents = [];

    // Inject Sprig Memories as a hidden user message at the very start
    if (memoryContext) {
      contents.push({
        role: "user",
        parts: [{ text: memoryContext }],
      });
      contents.push({
        role: "model",
        parts: [{ text: "I have reviewed my memories. How can I help you today?" }],
      });
    }

    // Add past history (limit to last 10 messages for token efficiency)
    const recentHistory = history ? history.slice(-10) : [];
    for (const msg of recentHistory) {
      contents.push({
        role: msg.sender === "ai" ? "model" : "user",
        parts: [{ text: msg.message }],
      });
    }

    // Add current user prompt
    contents.push({
      role: "user",
      parts: [{ text: sanitizedInput }],
    });

    const result = await model.generateContent({
      contents,
      generationConfig: {
        maxOutputTokens: 500,
        temperature: 0.7,
      },
    });

    const responseText = result.response.text();
    return NextResponse.json({ reply: responseText, isMock: false });
  } catch (error) {
    console.error("Gemini Chat API Error:", error);

    const errMsg = error instanceof Error ? error.message : String(error);
    if (
      errMsg.includes("503") ||
      errMsg.includes("high demand") ||
      errMsg.includes("429") ||
      errMsg.includes("quota") ||
      errMsg.includes("limit") ||
      errMsg.includes("Service Unavailable")
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
          "Failed to generate AI response: " +
          (error instanceof Error ? error.message : String(error)),
      },
      { status: 500 }
    );
  }
}

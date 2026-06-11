import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;

// Check if Gemini is configured
const isGeminiConfigured = (): boolean => {
  return !!(apiKey && apiKey !== "your-gemini-api-key");
};

export async function POST(req: Request) {
  try {
    const { message, history } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // FALLBACK MOCK CHAT INTELLIGENCE
    if (!isGeminiConfigured()) {
      let reply = "I am processing your query. That seems like a solid way to optimize your carbon footprint! Try reducing your daily electric consumption or opting for public transit.";
      const msgLower = message.toLowerCase();
      
      if (msgLower.includes("order food") || msgLower.includes("delivery") || msgLower.includes("eat") || msgLower.includes("dinner")) {
        reply = "Cooking at home would reduce your emissions by approximately 1.8 kg CO₂ compared to food delivery. Based on your logs, food transport is a key contributor to your footprint this week. Would you like a quick green recipe suggestion?";
      } else if (msgLower.includes("travel") || msgLower.includes("car") || msgLower.includes("transport") || msgLower.includes("drive")) {
        reply = "Switching to public transit or cycling for trips under 5km cuts carbon emissions by up to 85%. Your weekly transit footprint is currently 12.4 kg CO₂. Consider logging a bicycle ride tomorrow!";
      } else if (msgLower.includes("electricity") || msgLower.includes("appliance") || msgLower.includes("ac") || msgLower.includes("energy")) {
        reply = "High electricity usage detected in your logs (3.2 kg CO₂ yesterday). Setting your thermostat just 2°C higher or unplugging idle appliances can save about 1.2 kg CO₂ daily and reduce your utility bill.";
      } else if (msgLower.includes("plant") || msgLower.includes("vegetation") || msgLower.includes("3d")) {
        reply = "Your 3D virtual planet is a living reflection of your habits. Planting trees by logging green actions (like biking or recycling) increases vegetation. High electricity spikes activate pollution smog, which can desertify terrain.";
      }
      
      return NextResponse.json({ reply, isMock: true });
    }

    // Initialize Gemini Client
    const genAI = new GoogleGenerativeAI(apiKey!);
    
    // We use gemini-2.5-flash which has free-tier quota support
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      systemInstruction: `You are the AI Sustainability Twin for the user in the EcoBuddy AI platform. Your goal is to guide the user towards a lower carbon footprint in a supportive, empathetic, and gamified way, like a blend of ChatGPT and a sustainability mentor.
      
      When answering:
      - Use concrete metrics where possible (e.g. 'Cooking at home saves 1.8 kg CO2 compared to delivery').
      - Provide practical, immediate options suitable for various budgets.
      - Consider that they are logging transport, diet, energy, and waste actions.
      - Remind them they earn XP and Green Score points when they log positive habits.
      - Keep answers positive, educational, and structured in Markdown. Use bullet points for options.
      - Keep responses under 3 paragraphs to ensure they are readable and engaging.
      
      CRITICAL: Whenever you recommend a specific green action or footprint-reducing habit to the user, you MUST append a structured tag at the end of the text on its own line in this exact format:
      [Action: Action Description | Offset: Numeric Offset in kg | Category: transport/diet/energy/waste | XP: Numeric XP Reward]
      Examples:
      [Action: Bicycle commute instead of car | Offset: 1.5 | Category: transport | XP: 80]
      [Action: Eat fully plant-based lunch | Offset: 1.8 | Category: diet | XP: 100]
      [Action: Unplug idle home electronics | Offset: 0.6 | Category: energy | XP: 50]
      Include AT MOST one action tag per response. Make sure it matches the exact structure so the UI can parse it correctly.`,
    });

    // Format chat history for Gemini API
    const contents = [];
    
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
      parts: [{ text: message }],
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
  } catch (error: any) {
    console.error("Gemini Chat API Error:", error);
    
    const errMsg = error?.message || "";
    if (
      errMsg.includes("503") ||
      errMsg.includes("high demand") ||
      errMsg.includes("429") ||
      errMsg.includes("quota") ||
      errMsg.includes("limit") ||
      errMsg.includes("Service Unavailable")
    ) {
      return NextResponse.json(
        { error: "The AI model is experiencing high demand or has reached its rate limits. Please try again in a few minutes." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: "Failed to generate AI response: " + error.message },
      { status: 500 }
    );
  }
}

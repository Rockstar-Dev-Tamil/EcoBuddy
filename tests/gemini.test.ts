import { describe, it, expect } from "vitest";

// Mocking environment variables
const getIsGeminiConfigured = (apiKey: string | undefined) => {
  return !!(apiKey && apiKey !== "your-gemini-api-key");
};

// Extracted keyword reply logic from POST route for isolated testing
const getFallbackReply = (message: string) => {
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
  
  return reply;
};

describe("Gemini Configuration and Fallback Queries", () => {
  describe("isGeminiConfigured helper", () => {
    it("returns false for undefined API keys", () => {
      expect(getIsGeminiConfigured(undefined)).toBe(false);
    });

    it("returns false for dummy default placeholder API key", () => {
      expect(getIsGeminiConfigured("your-gemini-api-key")).toBe(false);
    });

    it("returns true for configured custom API keys", () => {
      expect(getIsGeminiConfigured("AIzaSyExampleAPIKey-XYZ")).toBe(true);
    });
  });

  describe("Twin Chatbot keyword matching triggers", () => {
    it("returns food/diet suggestion when question includes 'order food'", () => {
      const reply = getFallbackReply("Can I order food tonight?");
      expect(reply).toContain("Cooking at home");
      expect(reply).toContain("1.8 kg CO₂");
    });

    it("returns travel suggestion when question includes 'car'", () => {
      const reply = getFallbackReply("I drove my car to work");
      expect(reply).toContain("public transit");
      expect(reply).toContain("cycling");
    });

    it("returns energy warning when question includes 'electricity'", () => {
      const reply = getFallbackReply("How is my electricity footprint?");
      expect(reply).toContain("thermostat");
      expect(reply).toContain("3.2 kg CO₂");
    });

    it("returns generic default reply if no keywords match", () => {
      const reply = getFallbackReply("Hi there, how are you?");
      expect(reply).toContain("I am processing your query");
    });
  });
});

import { ChatMessage } from "@/types";

export class GeminiChatService {
  /**
   * Sends a message to the AI Twin and returns the reply.
   */
  static async sendMessage(message: string, history: ChatMessage[], context?: Record<string, unknown>): Promise<string> {
    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history, context }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "API Route returned an error status");
      }

      const data = await response.json();
      return data.reply;
    } catch (error) {
      console.warn("AI Chat API failed:", error);
      const errMsg = error instanceof Error ? error.message : String(error);
      if (errMsg.includes("connection") || errMsg.includes("Network") || errMsg.includes("fetch")) {
        return "I'm sorry, my neural plant pathways are currently disconnected! 🌿 Please check your connection or try again in a few moments.";
      } else {
        return "I'm sorry, my neural plant pathways are currently overloaded! 🌿 I am experiencing high demand. Please try again shortly once my leaves have rested.";
      }
    }
  }
}

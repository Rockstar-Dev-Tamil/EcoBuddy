export class GeminiEcoSnapService {
  /**
   * Scans an image to analyze its environmental impact.
   */
  static async scanImage(imageBase64: string, filename: string): Promise<Record<string, unknown>> {
    const response = await fetch("/api/scan", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64, filename }),
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Failed to scan image");
    }

    return await response.json();
  }
}

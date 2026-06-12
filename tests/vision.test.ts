import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  isGoogleVisionConfigured,
  getGoogleAccessToken,
  heuristicParseOCR
} from "../src/app/api/scan/route";

describe("Google Cloud Vision API Helper Logic", () => {
  const mockServiceAccount = {
    project_id: "test-project-123",
    client_email: "test-client@test-project-123.iam.gserviceaccount.com",
    private_key: "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDNY+wvneYAQd3+\nKVHp9Wfu58WlvrxG/jgPFh9kulVSzLjawjc6e41vRFxV6O2ex/e1VcZTBZqZKPb8\n+MkrXgdWXRhtxRGs5EW9N+MVjXdTFf5UYo7uHS2dNa3VfTEkwHt1TbbH8r1Zdrt3\nsqpbGqez35emLueM5vZMi3XdnvAVdG+u1UFKG+O5RP6cZGv3wMrYHtrTOcyvItiA\nEwgWnLmke3PlfVKNoGZPL0R5MxTLDG0GRrcrTbrio8fM4BD1H4GVm5eIjy0YlX/G\n4bQVcFXsIap6EXun8XhLEkcxdryuAA5oNs0y3XENvg0M+ktwmRT8ChN+o9JevLMc\nFixRvH85AgMBAAECggEAMhneSs0/BjALCU0mBKaOyEm0PlaVEdJAdXmlhcooNw7m\nRsKae0MZQJuR1IkBsbpAs/Ss8KKM0DCccx/y3ofMzWXfKCOqyJxUYLBJzf+YrGVQ\niWATUoU+k7s84LdtrfPgCcC/xe1x/+lFGJE2GgwZ/Xgcw3ZsmEPcr9ZTFZEIKosx\nNk99VdLHkQhmUJeb+m2IiaEQN8ws+7NlKg11d6bCQYoHcTEFiqYc7s/pEmlo7MIy\nbRn6GfBhjowCMawcrpEj4eQ7t59ZQ9gt/+ZZo+fR/4BtVdWaVj96UiGCJKOvKgBx\nNl7iRUp82/1K9oLiy3KqOizwBMIXdNVDIeKSuOXR6QKBgQDl3SM4LpgoiccIulL5\nWPZe17Kt4MnJTkJUL+XpD0Vmm+YcWgu1XPbjbn27G5ComJsVWEbvOowQsEXyr2nx\nHoeFQniCyOqcbr9JQlVgZbTUp/HkVzW8uhHy6QF1tuYU05IKXN9fj3+XoaPe7yFr\ngBfypKkAK4PvxpMAAShaNaNjVQKBgQDkvml1wxwyldOw9ge8AnVoHaM5drwhAWHk\nZSTboEQ6zu4fBX/WmpKy3QdnI8UaPsVtLllXYgEcRShHiWdSfHLPo3eK5grMEgme\na4+8tPxKBch9S2XHkBfMpkMQdSGY3JLoUeU/6rHUax1wjUFuGiHXywCK/ZQfr+hN\nDoXyh5J0VQKBgDUlwUvvMg1FdfilpCO1Fxnsw4qCjAV4i8uNW5pcho5oA3eQtl5T\nxV3moTmO8Q6aYlk4FQahQdtl9nZbaqJujaUZLmYG8IAE90OIC9eDDKGSx1Ile+5M\nE3RXvZerF12/YWf1+0vMERNNM2eLYO3LKz5WJiE87n+VKU359ouNFV8VAoGBAMm2\nH8l5BKSW+tZSHv/sKxxlBkrmKX/xeCGwD5CdA43YbKNudg0IwdR4lM6e/HDoabCd\n7qrgAZqsYZiz0ikrFROFUyVpNpw+S70nnNkLwG6GKwZSNq6EongVJY6du8LQv7ue\nfEqg67AlxRA7gDdXVAC3QwNOGhDXTkKlS/lTFBMBAoGBALicPel0K18VTBixw1PB\nHgpHvmu6MPvugbFGVpdf8a4rapQAijzuDDLISBPVsaeC5FTrWD625NhrwcKuoPkq\nm1lG21jYhIcXhiVSfHXAxsIQz3L6xNOb2M6oj3UOSwvK3lteucK3rbQ6XD03rAw+\ncSXANnEWPoRZGlNp0fjX6k5w\n-----END PRIVATE KEY-----\n"
  };

  describe("isGoogleVisionConfigured", () => {
    it("returns true when serviceAccount has required keys", () => {
      // The default setup will load the JSON file in root folder, which is configured.
      // So this should return true.
      expect(isGoogleVisionConfigured()).toBe(true);
    });
  });

  describe("heuristicParseOCR", () => {
    it("correctly identifies energy category from electric keyword in OCR text", () => {
      const ocr = "DUKE ENERGY CHARLOTTE NC\nTOTAL ELECTRIC POWER BILL: 120.5 kWh\nCUSTOMER CHARGES 24.50";
      const result = heuristicParseOCR(ocr);
      
      expect(result.scannedType).toBe("energy");
      expect(result.summaryDescription).toBe("Utility Bill (OCR)");
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items[0].value).toBe(120.5);
      expect(result.items[0].unit).toBe("kwh");
    });

    it("correctly identifies waste category from store receipt in OCR text", () => {
      const ocr = "WALMART SUPERMARKET RECEIPT\n1x ECO BAG 0.50\n2x WATER BOTTLE 1.20\nTOTAL $1.70";
      const result = heuristicParseOCR(ocr);
      
      expect(result.scannedType).toBe("waste");
      expect(result.summaryDescription).toBe("Shopping Receipt (OCR)");
    });

    it("falls back to diet category for generic items", () => {
      const ocr = "ORGANIC SALAD MIX\n100% VEGAN INGREDIENTS";
      const result = heuristicParseOCR(ocr);
      
      expect(result.scannedType).toBe("diet");
      expect(result.summaryDescription).toBe("Scanned Item (OCR parse)");
    });
  });

  describe("getGoogleAccessToken", () => {
    let originalFetch: typeof global.fetch;

    beforeEach(() => {
      originalFetch = global.fetch;
    });

    afterEach(() => {
      global.fetch = originalFetch;
    });

    it("generates a signed JWT and returns the access token on successful exchange", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          access_token: "mock-google-access-token-xyz123",
          expires_in: 3600,
          token_type: "Bearer"
        })
      });

      const token = await getGoogleAccessToken(mockServiceAccount);
      
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://oauth2.googleapis.com/token",
        expect.objectContaining({
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: expect.stringContaining("grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=")
        })
      );
      expect(token).toBe("mock-google-access-token-xyz123");
    });

    it("throws an error when the token response is not ok", async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: false,
        text: async () => "Invalid assertion"
      });

      await expect(getGoogleAccessToken(mockServiceAccount)).rejects.toThrow(
        "Failed to exchange JWT for Google access token: Invalid assertion"
      );
    });
  });
});

import { describe, it, expect } from "vitest";
import {
  calculateXPLevel,
  calculateGreenScoreDelta,
  applyGreenScore,
  calculatePlanetUpdates,
  classifyDetectiveSeverity,
  aggregateCategoryTotals,
} from "../../src/lib/carbon-utils";

describe("Vitest Edge Case Math Checks", () => {
  describe("calculateXPLevel", () => {
    it("handles negative XP gracefully by defaulting to level 1", () => {
      const result = calculateXPLevel(-500);
      expect(result.level).toBe(1);
      expect(result.progressPercent).toBeLessThanOrEqual(0);
    });

    it("handles extremely high XP limits", () => {
      const result = calculateXPLevel(1_000_000);
      expect(result.level).toBe(1001);
      expect(result.xpInLevel).toBe(0);
    });
  });

  describe("calculateGreenScoreDelta", () => {
    it("handles zero offset correctly", () => {
      const delta = calculateGreenScoreDelta(0);
      expect(delta).toBeCloseTo(0);
    });

    it("handles very large positive offsets, clamping score increase to 5", () => {
      expect(calculateGreenScoreDelta(1000)).toBe(5);
    });

    it("handles very large negative offsets, clamping score decrease to -8", () => {
      expect(calculateGreenScoreDelta(-1000)).toBe(-8);
    });

    it("handles small decimal offsets", () => {
      const positiveDelta = calculateGreenScoreDelta(0.001);
      expect(positiveDelta).toBe(1); // ceil(0.002)

      const negativeDelta = calculateGreenScoreDelta(-0.001);
      expect(negativeDelta).toBe(-1); // -ceil(0.0025)
    });
  });

  describe("applyGreenScore", () => {
    it("clamps score strictly to lower bound of 10", () => {
      expect(applyGreenScore(10, -5)).toBe(10);
      expect(applyGreenScore(15, -20)).toBe(10);
    });

    it("clamps score strictly to upper bound of 100", () => {
      expect(applyGreenScore(100, 5)).toBe(100);
      expect(applyGreenScore(95, 20)).toBe(100);
    });

    it("supports negative boundary values", () => {
      expect(applyGreenScore(0, 50)).toBe(50); // initial is below 10 but will output within clamp bounds if delta matches
      expect(applyGreenScore(-50, 200)).toBe(100);
    });
  });

  describe("calculatePlanetUpdates", () => {
    const basePlanet = {
      pollution: 0.5,
      desertification: 0.5,
      atmosphere_clarity: 0.5,
      vegetation: 0.5,
      wildlife: 0.5,
    };

    it("supports invalid or unknown category codes without throwing", () => {
      const updates = calculatePlanetUpdates("unknown_cat_code", 1.5, basePlanet);
      expect(updates.pollution).toBeDefined();
      expect(updates.desertification).toBeDefined();
    });

    it("handles exactly neutral carbon offset values", () => {
      const updates = calculatePlanetUpdates("transportation", 0, basePlanet);
      // pollution increase is 0 * 0.05, so stays close to base
      expect(updates.pollution).toBeCloseTo(0.5);
    });
  });

  describe("classifyDetectiveSeverity", () => {
    it("handles zero total emissions correctly without NaN division errors", () => {
      expect(classifyDetectiveSeverity(0, 0)).toBe("low");
      expect(classifyDetectiveSeverity(5, 0)).toBe("medium");
    });

    it("classifies correctly when value is larger than total (data correction case)", () => {
      expect(classifyDetectiveSeverity(15, 10)).toBe("high");
    });
  });

  describe("aggregateCategoryTotals", () => {
    it("skips items that have invalid fields and routes to fallback", () => {
      const logs = [
        { category: "invalid", co2_emission: 5.5 },
        { category: "water", co2_emission: 2.2 },
      ];
      const result = aggregateCategoryTotals(logs);
      expect(result.waste).toBe(5.5);
      expect(result.water).toBe(2.2);
    });

    it("correctly normalizes abbreviated short categories ('diet', 'transport', 'energy')", () => {
      const logs = [
        { category: "diet", co2_emission: 1.0 },
        { category: "transport", co2_emission: 2.0 },
        { category: "energy", co2_emission: 3.0 },
      ];
      const result = aggregateCategoryTotals(logs);
      expect(result.food).toBe(1.0);
      expect(result.transportation).toBe(2.0);
      expect(result.electricity).toBe(3.0);
    });
  });
});

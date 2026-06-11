/**
 * carbon-utils.test.ts
 *
 * Unit tests for the pure carbon-utils helper module.
 * These tests require no React rendering — they exercise logic directly.
 */

import { describe, it, expect } from "vitest";
import {
  calculateXPLevel,
  getLevelName,
  calculateGreenScoreDelta,
  applyGreenScore,
  calculatePlanetUpdates,
  classifyDetectiveSeverity,
  aggregateCategoryTotals,
  XP_PER_LEVEL,
} from "../src/lib/carbon-utils";

// ---------------------------------------------------------------------------
// calculateXPLevel
// ---------------------------------------------------------------------------
describe("calculateXPLevel", () => {
  it("returns Level 1 for zero XP with correct progress", () => {
    const result = calculateXPLevel(0);
    expect(result.level).toBe(1);
    expect(result.xpInLevel).toBe(0);
    expect(result.xpToNext).toBe(XP_PER_LEVEL);
    expect(result.progressPercent).toBe(0);
  });

  it("returns Level 1 for 999 XP (just below threshold)", () => {
    const result = calculateXPLevel(999);
    expect(result.level).toBe(1);
    expect(result.xpInLevel).toBe(999);
    expect(result.xpToNext).toBe(1);
  });

  it("returns Level 2 for exactly 1000 XP", () => {
    const result = calculateXPLevel(1000);
    expect(result.level).toBe(2);
    expect(result.xpInLevel).toBe(0);
    expect(result.progressPercent).toBe(0);
  });

  it("returns correct breakdown for mid-level XP", () => {
    const result = calculateXPLevel(2500);
    expect(result.level).toBe(3);
    expect(result.xpInLevel).toBe(500);
    expect(result.xpToNext).toBe(500);
    expect(result.progressPercent).toBe(50);
  });

  it("returns Level 6 for 5000 XP", () => {
    expect(calculateXPLevel(5000).level).toBe(6);
  });
});

// ---------------------------------------------------------------------------
// getLevelName
// ---------------------------------------------------------------------------
describe("getLevelName", () => {
  it("returns Seed for Level 1", () => {
    expect(getLevelName(1)).toBe("Seed");
  });

  it("returns Sprout for Levels 2–4", () => {
    expect(getLevelName(2)).toBe("Sprout");
    expect(getLevelName(4)).toBe("Sprout");
  });

  it("returns Plant for Levels 5–9", () => {
    expect(getLevelName(5)).toBe("Plant");
    expect(getLevelName(9)).toBe("Plant");
  });

  it("returns Tree for Levels 10–14", () => {
    expect(getLevelName(10)).toBe("Tree");
    expect(getLevelName(14)).toBe("Tree");
  });

  it("returns Forest Guardian for Level 15+", () => {
    expect(getLevelName(15)).toBe("Forest Guardian");
    expect(getLevelName(100)).toBe("Forest Guardian");
  });
});

// ---------------------------------------------------------------------------
// calculateGreenScoreDelta
// ---------------------------------------------------------------------------
describe("calculateGreenScoreDelta", () => {
  it("returns positive delta for a carbon offset > 0", () => {
    const delta = calculateGreenScoreDelta(1.5);
    expect(delta).toBeGreaterThan(0);
  });

  it("caps positive delta at +5 for large offsets", () => {
    expect(calculateGreenScoreDelta(100)).toBe(5);
  });

  it("returns negative delta for a carbon emission (offset < 0)", () => {
    const delta = calculateGreenScoreDelta(-2);
    expect(delta).toBeLessThan(0);
  });

  it("caps negative delta at -8 for large emissions", () => {
    expect(calculateGreenScoreDelta(-100)).toBe(-8);
  });

  it("returns 0 for an exactly neutral offset", () => {
    // Note: JS may return -0 for Math.ceil(0)*-1, so we use toBeCloseTo
    expect(calculateGreenScoreDelta(0)).toBeCloseTo(0);
  });
});

// ---------------------------------------------------------------------------
// applyGreenScore
// ---------------------------------------------------------------------------
describe("applyGreenScore", () => {
  it("clamps score to a minimum of 10", () => {
    expect(applyGreenScore(12, -20)).toBe(10);
  });

  it("clamps score to a maximum of 100", () => {
    expect(applyGreenScore(98, +10)).toBe(100);
  });

  it("applies delta correctly within bounds", () => {
    expect(applyGreenScore(50, 5)).toBe(55);
    expect(applyGreenScore(50, -3)).toBe(47);
  });
});

// ---------------------------------------------------------------------------
// calculatePlanetUpdates
// ---------------------------------------------------------------------------
describe("calculatePlanetUpdates", () => {
  const basePlanet = {
    pollution: 0.5,
    desertification: 0.4,
    atmosphere_clarity: 0.6,
    vegetation: 0.5,
    wildlife: 0.5,
  };

  it("reduces pollution and desertification for positive offset", () => {
    const updates = calculatePlanetUpdates("transport", 2, basePlanet);
    expect(updates.pollution).toBeLessThan(basePlanet.pollution);
    expect(updates.desertification).toBeLessThan(basePlanet.desertification);
  });

  it("increases atmosphere_clarity for transport category offset", () => {
    const updates = calculatePlanetUpdates("transport", 2, basePlanet);
    expect(updates.atmosphere_clarity).toBeGreaterThan(basePlanet.atmosphere_clarity);
  });

  it("increases wildlife and vegetation for diet offset", () => {
    const updates = calculatePlanetUpdates("diet", 1.5, basePlanet);
    expect(updates.wildlife).toBeGreaterThan(basePlanet.wildlife);
    expect(updates.vegetation).toBeGreaterThan(basePlanet.vegetation);
  });

  it("increases vegetation for waste offset", () => {
    const updates = calculatePlanetUpdates("waste", 1, basePlanet);
    expect(updates.vegetation).toBeGreaterThan(basePlanet.vegetation);
  });

  it("increases pollution and desertification for negative offset (emission)", () => {
    const updates = calculatePlanetUpdates("transport", -3, basePlanet);
    expect(updates.pollution).toBeGreaterThan(basePlanet.pollution);
    expect(updates.desertification).toBeGreaterThan(basePlanet.desertification);
  });
});

// ---------------------------------------------------------------------------
// classifyDetectiveSeverity
// ---------------------------------------------------------------------------
describe("classifyDetectiveSeverity", () => {
  it("returns 'high' when category share > 40%", () => {
    expect(classifyDetectiveSeverity(50, 100)).toBe("high");
  });

  it("returns 'high' when absolute value > 8 kg", () => {
    expect(classifyDetectiveSeverity(9, 15)).toBe("high");
  });

  it("returns 'high' when value > 8 kg even if percentage <= 40%", () => {
    // 25 kg out of 100 is 25% — but since the absolute value is 25 > 8, it's 'high'
    expect(classifyDetectiveSeverity(25, 100)).toBe("high");
  });

  it("returns 'medium' when share is > 20% but absolute value <= 8 and share <= 40%", () => {
    // 3 kg out of 10 = 30%, value 3 <= 4, but percentage > 20%
    expect(classifyDetectiveSeverity(3, 10)).toBe("medium");
  });

  it("returns 'medium' when absolute value > 4 kg", () => {
    expect(classifyDetectiveSeverity(5, 30)).toBe("medium");
  });

  it("returns 'low' for small values", () => {
    expect(classifyDetectiveSeverity(1, 100)).toBe("low");
    expect(classifyDetectiveSeverity(0, 0)).toBe("low");
  });
});

// ---------------------------------------------------------------------------
// aggregateCategoryTotals
// ---------------------------------------------------------------------------
describe("aggregateCategoryTotals", () => {
  it("sums CO2 correctly per known category", () => {
    const logs = [
      { category: "transport", co2_emission: 3.0 },
      { category: "transport", co2_emission: 1.5 },
      { category: "diet", co2_emission: 2.0 },
    ];
    const totals = aggregateCategoryTotals(logs);
    expect(totals.transport).toBeCloseTo(4.5);
    expect(totals.diet).toBeCloseTo(2.0);
    expect(totals.energy).toBe(0);
    expect(totals.waste).toBe(0);
  });

  it("routes unknown categories to 'waste' bucket", () => {
    const logs = [{ category: "unknown_category", co2_emission: 1.0 }];
    const totals = aggregateCategoryTotals(logs);
    expect(totals.waste).toBeCloseTo(1.0);
  });

  it("returns all-zero record for an empty log array", () => {
    const totals = aggregateCategoryTotals([]);
    expect(totals).toEqual({ transport: 0, diet: 0, energy: 0, waste: 0 });
  });
});

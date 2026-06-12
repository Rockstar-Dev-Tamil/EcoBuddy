/**
 * carbon-utils.ts
 *
 * Pure, zero-dependency utility functions for all carbon-related calculations.
 * Extracted from game-store.tsx and dashboard/page.tsx so that they can be
 * unit-tested independently without needing to mount React components.
 */

import type { PlanetState } from "@/types";

// ---------------------------------------------------------------------------
// XP / Level helpers
// ---------------------------------------------------------------------------

/** XP required to reach the next level (every 1000 XP = 1 level). */
export const XP_PER_LEVEL = 1000;

/**
 * Given a raw XP value, returns a structured breakdown of the current level,
 * progress within that level, and how many XP remain until the next level.
 */
export function calculateXPLevel(xp: number): {
  level: number;
  xpInLevel: number;
  xpToNext: number;
  progressPercent: number;
} {
  const level = Math.max(1, Math.floor(xp / XP_PER_LEVEL) + 1);
  const xpInLevel = xp % XP_PER_LEVEL;
  const xpToNext = XP_PER_LEVEL - xpInLevel;
  const progressPercent = (xpInLevel / XP_PER_LEVEL) * 100;
  return { level, xpInLevel, xpToNext, progressPercent };
}

/**
 * Returns the human-readable level tier name for a given numeric level.
 */
export function getLevelName(level: number): string {
  if (level >= 15) return "Forest Guardian";
  if (level >= 10) return "Tree";
  if (level >= 5) return "Plant";
  if (level >= 2) return "Sprout";
  return "Seed";
}

// ---------------------------------------------------------------------------
// Green Score helpers
// ---------------------------------------------------------------------------

/**
 * Calculates how much the Green Score should change given a carbon offset value.
 * Positive offset → score increases; negative (emission) → score decreases.
 * Result is clamped so the final score stays in [10, 100].
 */
export function calculateGreenScoreDelta(carbonOffset: number): number {
  if (carbonOffset > 0) {
    return Math.min(5, Math.ceil(carbonOffset * 2));
  }
  return -Math.min(8, Math.ceil(Math.abs(carbonOffset) * 2.5));
}

/**
 * Applies a delta to the current green score, clamping it within [10, 100].
 */
export function applyGreenScore(current: number, delta: number): number {
  return Math.max(10, Math.min(100, current + delta));
}

// ---------------------------------------------------------------------------
// Planet state helpers
// ---------------------------------------------------------------------------

/**
 * Calculates partial updates to the planet state record based on a logged action.
 * Returns only the fields that need updating so callers can spread them into
 * an upsert operation.
 */
export function calculatePlanetUpdates(
  category: string,
  carbonOffset: number,
  current: Pick<
    PlanetState,
    "pollution" | "desertification" | "atmosphere_clarity" | "vegetation" | "wildlife"
  >
): Partial<PlanetState> {
  const isPositive = carbonOffset > 0;
  const mag = Math.abs(carbonOffset);
  const updates: Partial<PlanetState> = {};

  if (isPositive) {
    updates.pollution = current.pollution - mag * 0.03;
    updates.desertification = current.desertification - mag * 0.02;

    switch (category) {
      case "transportation":
        updates.atmosphere_clarity = current.atmosphere_clarity + mag * 0.05;
        break;
      case "food":
        updates.wildlife = current.wildlife + 0.03;
        updates.vegetation = current.vegetation + 0.02;
        break;
      case "electricity":
        updates.atmosphere_clarity = current.atmosphere_clarity + mag * 0.04;
        break;
      case "water":
        updates.desertification = current.desertification - mag * 0.04;
        break;
      case "shopping":
      case "waste":
        updates.vegetation = current.vegetation + 0.04;
        break;
    }
  } else {
    updates.pollution = current.pollution + mag * 0.05;
    updates.desertification = current.desertification + mag * 0.03;
    updates.atmosphere_clarity = current.atmosphere_clarity - mag * 0.04;
    updates.vegetation = current.vegetation - mag * 0.02;
    updates.wildlife = current.wildlife - mag * 0.03;
  }

  return updates;
}

// ---------------------------------------------------------------------------
// Carbon Detective helpers
// ---------------------------------------------------------------------------

export type DetectiveSeverity = "high" | "medium" | "low";

/**
 * Classifies the severity of a category's emissions contribution.
 *
 * @param value - Absolute CO2 emissions for this category (kg).
 * @param total - Total CO2 emissions across all categories.
 */
export function classifyDetectiveSeverity(
  value: number,
  total: number
): DetectiveSeverity {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  if (percentage > 40 || value > 8) return "high";
  if (percentage > 20 || value > 4) return "medium";
  return "low";
}

/**
 * Aggregates an array of sustainability logs into per-category emission totals.
 */
export function aggregateCategoryTotals(
  logs: Array<{ category: string; co2_emission: number }>
): Record<string, number> {
  const totals: Record<string, number> = {
    food: 0,
    transportation: 0,
    electricity: 0,
    shopping: 0,
    water: 0,
    waste: 0,
  };

  for (const log of logs) {
    const cat = log.category in totals ? log.category : "waste";
    totals[cat] += log.co2_emission;
  }

  return totals;
}

export const CARBON_CONSTANTS = {
  food: {
    "Vegetarian meal": 0.5,
    "Chicken meal": 2.5,
    "Beef meal": 7.0,
    "Dairy consumption": 1.2,
  },
  transportation: {
    "Car": 0.2, // per km
    "Motorcycle": 0.1, // per km
    "Metro": 0.03, // per km
    "Bus": 0.05, // per km
    "Train": 0.04, // per km
    "Walking": 0,
    "Bicycle": 0,
  },
  electricity: {
    "AC usage": 1.2, // per hour
    "Fan usage": 0.05, // per hour
    "Refrigerator": 0.1, // per hour
    "TV": 0.08, // per hour
    "Washing machine": 0.5, // per load
  },
  shopping: {
    "Clothes": 5.0, // per item
    "Electronics": 20.0, // per item
    "Daily purchases": 1.5,
  },
  water: {
    "Showers": 0.3, // per shower
    "Washing": 0.2, // per load
    "Household consumption": 0.5, // daily baseline
  },
  waste: {
    "Plastic waste": 1.5, // per kg
    "Recycling": -0.5, // per kg offset
    "Composting": -0.8, // per kg offset
  }
};

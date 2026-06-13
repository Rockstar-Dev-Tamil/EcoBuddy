/**
 * carbon-utils.ts
 *
 * Pure, zero-dependency utility functions for all carbon-related calculations.
 * Extracted from game-store.tsx and dashboard/page.tsx so that they can be
 * unit-tested independently without needing to mount React components.
 */

import type { PlanetState } from "@/types";
import { CARBON_CONSTANTS } from "@/constants/carbon";

// Re-export constants for backward compatibility
export { CARBON_CONSTANTS };

/** XP required to reach the next level (every 1000 XP = 1 level). */
export const XP_PER_LEVEL = 1000;

/**
 * Given a raw XP value, returns a structured breakdown of the current level,
 * progress within that level, and how many XP remain until the next level.
 *
 * @param xp - The raw experience points value.
 * @returns An object containing the current level, progress, and remaining XP.
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
 *
 * @param level - The current user level.
 * @returns A string representing the level's tier name.
 */
export function getLevelName(level: number): string {
  if (level >= 15) return "Forest Guardian";
  if (level >= 10) return "Tree";
  if (level >= 5) return "Plant";
  if (level >= 2) return "Sprout";
  return "Seed";
}

/**
 * Calculates how much the Green Score should change given a carbon offset value.
 * Positive offset → score increases; negative (emission) → score decreases.
 * Result is clamped so the final score stays in [10, 100].
 *
 * @param carbonOffset - Carbon offset in kg (positive for reductions, negative for emissions).
 * @returns The delta value to apply to the green score.
 */
export function calculateGreenScoreDelta(carbonOffset: number): number {
  if (carbonOffset > 0) {
    return Math.min(5, Math.ceil(carbonOffset * 2));
  }
  return -Math.min(8, Math.ceil(Math.abs(carbonOffset) * 2.5));
}

/**
 * Applies a delta to the current green score, clamping it within [10, 100].
 *
 * @param current - The current green score.
 * @param delta - The delta value to apply.
 * @returns The new green score within [10, 100].
 */
export function applyGreenScore(current: number, delta: number): number {
  return Math.max(10, Math.min(100, current + delta));
}

/**
 * Calculates partial updates to the planet state record based on a logged action.
 * Returns only the fields that need updating so callers can spread them into
 * an upsert operation.
 *
 * @param category - Category of action (e.g. transport, diet).
 * @param carbonOffset - Impact magnitude of action.
 * @param current - The user's current planet status factors.
 * @returns A partial PlanetState updates structure.
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
      case "transport":
        updates.atmosphere_clarity = current.atmosphere_clarity + mag * 0.05;
        break;
      case "food":
      case "diet":
        updates.wildlife = current.wildlife + 0.03;
        updates.vegetation = current.vegetation + 0.02;
        break;
      case "electricity":
      case "energy":
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

export type DetectiveSeverity = "high" | "medium" | "low";

/**
 * Classifies the severity of a category's emissions contribution.
 *
 * @param value - Absolute CO2 emissions for this category (kg).
 * @param total - Total CO2 emissions across all categories.
 * @returns The severity tier: "high", "medium", or "low".
 */
export function classifyDetectiveSeverity(value: number, total: number): DetectiveSeverity {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
  if (percentage > 40 || value > 8) return "high";
  if (percentage > 20 || value > 4) return "medium";
  return "low";
}

/**
 * Aggregates an array of sustainability logs into per-category emission totals.
 *
 * @param logs - Array of logged actions.
 * @returns A record containing emission totals indexed by category name.
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
    let cat = log.category;
    // Map short codes to normalized schemas
    if (cat === "diet") cat = "food";
    if (cat === "transport") cat = "transportation";
    if (cat === "energy") cat = "electricity";

    const normalized = cat in totals ? cat : "waste";
    totals[normalized] += log.co2_emission;
  }

  return totals;
}

import { describe, it, expect, beforeEach } from "vitest";
import { MockDB } from "@/lib/mock-db";

describe("State Clamping and Edge Cases", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
  });

  it("prevents planet state variables from exceeding boundaries [0, 1]", () => {
    // Attempt to update vegetation with value 2.0 (out of bounds)
    const updated = MockDB.updatePlanetState({ vegetation: 2.0 });
    expect(updated.vegetation).toBe(1.0);

    // Attempt to update rivers with value -1.5 (out of bounds)
    const updatedNegative = MockDB.updatePlanetState({ rivers: -1.5 });
    expect(updatedNegative.rivers).toBe(0.0);
  });

  it("clamps user green score within boundaries [10, 100]", () => {
    // Log multiple positive actions to push score past 100
    for (let i = 0; i < 10; i++) {
      MockDB.addLog({
        category: "energy",
        description: "Solar offset action",
        carbon_offset: 10.0,
        co2_emission: 0,
        xp_earned: 10
      });
    }

    const updated = MockDB.getProfile();
    expect(updated.green_score).toBe(100);

    // Log multiple negative actions to push score below 10
    for (let i = 0; i < 15; i++) {
      MockDB.addLog({
        category: "transport",
        description: "Heavy car drive",
        carbon_offset: -10.0,
        co2_emission: 15.0,
        xp_earned: 0
      });
    }

    const finalProfile = MockDB.getProfile();
    expect(finalProfile.green_score).toBe(10); // Clamped at minimum 10
  });
});

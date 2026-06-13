import { describe, it, expect, beforeEach } from "vitest";
import { MockDB } from "@/lib/mock-db";

describe("MockDB Core Logic", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
  });

  it("retrieves the default user profile metrics", () => {
    const profile = MockDB.getProfile();
    expect(profile).toBeDefined();
    expect(profile.username).toBe("EcoAdventurer");
    expect(profile.level).toBe(1);
    expect(profile.green_score).toBe(64);
  });

  it("updates user XP and calculates level up thresholds", () => {
    const originalProfile = MockDB.getProfile();
    expect(originalProfile.level).toBe(1);

    // Add 1200 XP which should trigger level up to Level 2
    const updated = MockDB.updateProfile({ xp: originalProfile.xp + 1200 });
    expect(updated.xp).toBe(originalProfile.xp + 1200);
    expect(updated.level).toBe(2);
  });

  it("computes planet factors when logging sustainable actions", () => {
    const initialPlanet = MockDB.getPlanetState();

    // Log active transportation offset
    const log = MockDB.addLog({
      category: "transport",
      description: "Bycled to work",
      carbon_offset: 2.5,
      co2_emission: 0,
      xp_earned: 60,
    });

    expect(log.id).toBeDefined();

    // Check that planet vegetation or atmosphere clarity increased
    const updatedPlanet = MockDB.getPlanetState();
    expect(updatedPlanet.pollution).toBeLessThan(initialPlanet.pollution);
  });
});

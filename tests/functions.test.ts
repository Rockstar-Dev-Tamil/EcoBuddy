import { describe, it, expect } from "vitest";

// Utility function copied or imported to test mapping logic
const getLevelName = (lvl: number) => {
  if (lvl >= 15) return "Forest Guardian";
  if (lvl >= 10) return "Tree";
  if (lvl >= 5) return "Plant";
  if (lvl >= 2) return "Sprout";
  return "Seed";
};

// Date formatter helper commonly used to present timelines
const formatCompactDate = (isoString: string) => {
  const date = new Date(isoString);
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

describe("Utility Helper Functions", () => {
  describe("getLevelName mapping", () => {
    it("returns Seed for Level 1", () => {
      expect(getLevelName(1)).toBe("Seed");
    });

    it("returns Sprout for Level 2 and 4", () => {
      expect(getLevelName(2)).toBe("Sprout");
      expect(getLevelName(4)).toBe("Sprout");
    });

    it("returns Plant for Level 5 and 9", () => {
      expect(getLevelName(5)).toBe("Plant");
      expect(getLevelName(9)).toBe("Plant");
    });

    it("returns Tree for Level 10 and 14", () => {
      expect(getLevelName(10)).toBe("Tree");
      expect(getLevelName(14)).toBe("Tree");
    });

    it("returns Forest Guardian for Level 15+", () => {
      expect(getLevelName(15)).toBe("Forest Guardian");
      expect(getLevelName(100)).toBe("Forest Guardian");
    });
  });

  describe("formatCompactDate formatting", () => {
    it("formats ISO string date to Month Day", () => {
      const formatted = formatCompactDate("2026-06-11T12:00:00Z");
      expect(formatted).toBe("Jun 11");
    });
  });
});

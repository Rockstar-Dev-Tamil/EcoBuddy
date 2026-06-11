import { describe, it, expect } from "vitest";

export interface SustainabilityLog {
  category: string;
  co2_emission: number;
}

// Extracted Carbon Detective calculation formula for isolated test correctness
const calculateDetectiveFindings = (logs: SustainabilityLog[]) => {
  const categoryTotals: Record<string, number> = {
    transport: 0,
    diet: 0,
    energy: 0,
    waste: 0,
  };

  logs.forEach((log) => {
    const cat = log.category in categoryTotals ? log.category : "waste";
    categoryTotals[cat] += log.co2_emission;
  });

  const total = Object.values(categoryTotals).reduce((sum, v) => sum + v, 0);

  const config: Record<string, { desc: string; rec: string }> = {
    transport: { desc: "Single-passenger vehicle trips", rec: "Try public transit" },
    diet: { desc: "Meat heavy meals", rec: "Try plant-based options" },
    energy: { desc: "Power standby load", rec: "Optimize thermostat" },
    waste: { desc: "Plastic disposal", rec: "Recycle sorted metals" },
  };

  return Object.entries(categoryTotals).map(([category, value]) => {
    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
    let severity: "high" | "medium" | "low" = "low";
    
    if (percentage > 40 || value > 8) {
      severity = "high";
    } else if (percentage > 20 || value > 4) {
      severity = "medium";
    }

    return {
      category,
      totalEmissions: parseFloat(value.toFixed(1)),
      percentage,
      severity,
      description: config[category]?.desc || "Utility activity",
      recommendation: config[category]?.rec || "Recycle",
    };
  }).sort((a, b) => b.totalEmissions - a.totalEmissions);
};

describe("Carbon Detective Findings Severity & Math Calculations", () => {
  it("classifies severity correctly under various carbon loads", () => {
    const testLogs: SustainabilityLog[] = [
      { category: "transport", co2_emission: 12.0 }, // high emission (>8)
      { category: "diet", co2_emission: 5.0 },      // medium emission (>4)
      { category: "energy", co2_emission: 1.0 },    // low emission
    ];

    const findings = calculateDetectiveFindings(testLogs);
    
    // Ordered descending: transport (12.0), diet (5.0), energy (1.0), waste (0.0)
    expect(findings[0].category).toBe("transport");
    expect(findings[0].severity).toBe("high");

    expect(findings[1].category).toBe("diet");
    expect(findings[1].severity).toBe("medium");

    expect(findings[2].category).toBe("energy");
    expect(findings[2].severity).toBe("low");
  });

  it("calculates accurate percentages based on sum totals", () => {
    const testLogs: SustainabilityLog[] = [
      { category: "energy", co2_emission: 15.0 },
      { category: "waste", co2_emission: 5.0 },
    ]; // Total = 20.0

    const findings = calculateDetectiveFindings(testLogs);
    const energyFinding = findings.find(f => f.category === "energy");
    const wasteFinding = findings.find(f => f.category === "waste");

    expect(energyFinding?.percentage).toBe(75); // 15 / 20 * 100
    expect(wasteFinding?.percentage).toBe(25);  // 5 / 20 * 100
  });
});

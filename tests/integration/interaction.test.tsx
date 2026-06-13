import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import DashboardPage from "@/app/dashboard/page";

// Mock router
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock game store context methods
const mockLogAction = vi.fn();
vi.mock("@/stores/game-store", () => ({
  useGame: () => ({
    profile: { username: "Tester", level: 1, xp: 120, green_score: 55, streak_count: 2 },
    logs: [],
    challenges: [],
    planet: {
      vegetation: 0.5,
      rivers: 0.5,
      wildlife: 0.5,
      atmosphere_clarity: 0.5,
      pollution: 0.2,
      desertification: 0.3,
    },
    leaderboard: [],
    getDetectiveFindings: () => [],
    userId: "test-user-id",
    logAction: mockLogAction,
  }),
}));

// Mock ResizeObserver and charts
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  BarChart: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  Bar: () => <div />,
  Cell: () => <div />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Tooltip: () => <div />,
}));

describe("Dashboard Click Interactions", () => {
  beforeEach(() => {
    mockLogAction.mockClear();
  });

  it("triggers logAction when a quick-logging button is clicked", async () => {
    render(<DashboardPage />);

    // Find the Walk/Cycle Commute button (or click any quick logging button)
    const bikedButton = screen.getByRole("button", { name: /Walk\/Cycle Commute/i });
    expect(bikedButton).toBeInTheDocument();

    // Click it and wait for logging action
    fireEvent.click(bikedButton);

    // Wait for the simulated delay in DashboardPage (800ms)
    await new Promise((resolve) => setTimeout(resolve, 900));

    // Verify it called the game store action log handler
    expect(mockLogAction).toHaveBeenCalledOnce();
    expect(mockLogAction).toHaveBeenCalledWith(
      "transport",
      "Rode bicycle instead of car drive",
      0.0,
      2.1,
      60
    );
  }, 15000);
});

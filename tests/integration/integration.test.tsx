import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import { GameProvider, useGame } from "@/stores/game-store";

// Mock Supabase to enforce MockDB local fallback mode
vi.mock("@/lib/supabase", () => ({
  supabase: null,
  isSupabaseConfigured: () => false,
}));

// Mock next/navigation
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
  usePathname: () => "/dashboard",
}));

// Consumer Component for Integration Testing
const TestConsumer = () => {
  const { profile, logAction } = useGame();

  return (
    <div>
      <span data-testid="user-level">Level: {profile.level}</span>
      <span data-testid="green-score">Score: {profile.green_score}</span>
      <button
        data-testid="btn-log-action"
        onClick={() => logAction("transport", "Biked 10km", 0.0, 5.0, 100)}
      >
        Log Green Action
      </button>
    </div>
  );
};

describe("GameStore State Integration", () => {
  beforeEach(() => {
    if (typeof window !== "undefined") {
      localStorage.clear();
    }
  });

  it("links Provider state to the Consumer component and updates on action", async () => {
    render(
      <GameProvider>
        <TestConsumer />
      </GameProvider>
    );

    // Assert initial rendering states from MockDB seed values
    expect(screen.getByTestId("user-level")).toHaveTextContent("Level: 1");
    const initialScoreText = screen.getByTestId("green-score").textContent;

    // Simulate clicking the Log Action button
    const btn = screen.getByTestId("btn-log-action");
    await act(async () => {
      fireEvent.click(btn);
    });

    // Check that score updated in the DOM
    const updatedScoreText = screen.getByTestId("green-score").textContent;
    expect(updatedScoreText).not.toEqual(initialScoreText);
  });
});

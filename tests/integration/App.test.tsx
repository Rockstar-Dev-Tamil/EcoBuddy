import React from "react";
import { render, screen, act } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import LandingPage from "@/app/page";

// Mock routing
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock game store context
vi.mock("@/stores/game-store", () => ({
  useGame: () => ({
    userId: null,
    isLoading: false,
    profile: null,
    logs: [],
    challenges: [],
    achievements: [],
    leaderboard: [],
    getDetectiveFindings: () => [],
  }),
}));

// Mock supabase service
vi.mock("@/services/supabase-service", () => ({
  SupabaseService: {
    isEnabled: () => true,
  },
}));

// Mock 3D PlanetViewer component
vi.mock("@/features/planet-3d/planet-viewer", () => ({
  PlanetViewer: () => <div data-testid="mock-planet">Mock Planet</div>,
}));

describe("LandingPage UI Rendering", () => {
  it("renders the main brand titles and landing elements", () => {
    vi.useFakeTimers();
    render(<LandingPage />);
    act(() => {
      vi.advanceTimersByTime(3500);
    });

    // Check main titles and tags
    expect(screen.getByText("EcoBuddy AI")).toBeInTheDocument();
    expect(screen.getByText("The Autonomous Eco Companion")).toBeInTheDocument();
    expect(screen.getByText("CO₂ decisions simulated")).toBeInTheDocument();
    vi.useRealTimers();
  });

  it("renders the email authentication container", () => {
    vi.useFakeTimers();
    render(<LandingPage />);
    act(() => {
      vi.advanceTimersByTime(3500);
    });

    // Auth card labels & buttons
    expect(screen.getByText("Access EcoBuddy")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send verification code/i })).toBeInTheDocument();
    vi.useRealTimers();
  });
});

import React from "react";
import { render, screen, act } from "@testing-library/react";
import { vi, describe, it, expect, beforeEach } from "vitest";
import LandingPage from "@/app/page";
import { SupabaseService } from "@/services/supabase-service";

// Mock router
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

// Mock 3D PlanetViewer component
vi.mock("@/features/planet-3d/planet-viewer", () => ({
  PlanetViewer: () => <div data-testid="mock-planet">Mock Planet</div>,
}));

// Mock SupabaseService to toggle enabled state
vi.mock("@/services/supabase-service", () => ({
  SupabaseService: {
    isEnabled: vi.fn(),
  },
}));

describe("Database Resilience & Offline Guards", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays the Database Offline card when Supabase is disabled", () => {
    // Force database to show as offline/unconfigured
    vi.spyOn(SupabaseService, "isEnabled").mockReturnValue(false);

    vi.useFakeTimers();
    render(<LandingPage />);
    act(() => {
      vi.advanceTimersByTime(3500);
    });

    // Assert Warning text and variables code blocks are active
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(screen.getByText("Database Offline")).toBeInTheDocument();
    expect(screen.getByText(/Supabase environment variables are missing/i)).toBeInTheDocument();
    
    // Assert normal login/signup buttons and separators are not displayed
    expect(screen.queryByRole("button", { name: /continue with google/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /send verification code/i })).not.toBeInTheDocument();
    vi.useRealTimers();
  });

  it("renders standard auth form when database is online", () => {
    // Force database to show as online/configured
    vi.spyOn(SupabaseService, "isEnabled").mockReturnValue(true);

    vi.useFakeTimers();
    render(<LandingPage />);
    act(() => {
      vi.advanceTimersByTime(3500);
    });

    // Warning text should not be present
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.queryByText("Database Offline")).not.toBeInTheDocument();
    
    // Interactive login elements should be present
    expect(screen.getByRole("button", { name: /continue with google/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /send verification code/i })).toBeInTheDocument();
    vi.useRealTimers();
  });
});

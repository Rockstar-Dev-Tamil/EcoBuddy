import React from "react";
import { render, screen } from "@testing-library/react";
import { vi, describe, it, expect } from "vitest";
import { Navbar } from "@/components/navbar";

// Mock routers
vi.mock("next/navigation", () => ({
  usePathname: () => "/dashboard",
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock game store context
vi.mock("@/stores/game-store", () => ({
  useGame: () => ({
    profile: { username: "Tester", level: 2, xp: 1200, green_score: 64, streak_count: 5, avatar_url: "" },
    userId: "test-user-id",
    isLoading: false,
  }),
}));

// Mock SupabaseService
vi.mock("@/services/supabase-service", () => ({
  SupabaseService: {
    isEnabled: () => true,
  },
}));

describe("Navbar Navigation Layout UI", () => {
  it("renders desktop sidebar navigation items", () => {
    render(
      <Navbar>
        <div data-testid="page-child">Test Page Content</div>
      </Navbar>
    );

    // Verify main navigation links are present in the sidebar
    expect(screen.getAllByText("Dashboard")[0]).toBeInTheDocument();
    expect(screen.getAllByText("3D Planet")[0]).toBeInTheDocument();
    expect(screen.getAllByText("AI Twin")[0]).toBeInTheDocument();
    expect(screen.getAllByText("EcoSnap AI")[0]).toBeInTheDocument();
    expect(screen.getAllByText("2050 Simulator")[0]).toBeInTheDocument();
    expect(screen.getAllByText("Community")[0]).toBeInTheDocument();

    // Verify page content slot is rendered
    expect(screen.getByTestId("page-child")).toBeInTheDocument();
  });

  it("renders gamification stats and streak count", () => {
    render(
      <Navbar>
        <div>Content</div>
      </Navbar>
    );

    // Verify streak badge is displayed
    expect(screen.getByText("5 Day Streak")).toBeInTheDocument();
    
    // Verify level indicators are present
    expect(screen.getByText("Lvl 2")).toBeInTheDocument();
    expect(screen.getByText("Sprout")).toBeInTheDocument();
  });
});

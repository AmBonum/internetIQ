import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("@tanstack/react-router", async () => {
  const actual =
    await vi.importActual<typeof import("@tanstack/react-router")>("@tanstack/react-router");
  return {
    ...actual,
    Link: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <a className={className}>{children}</a>
    ),
  };
});

import { TestPackCard } from "@/components/test-packs/TestPackCard";
import type { TestPack } from "@/content/test-packs";

const fixture: TestPack = {
  slug: "fixture-pack",
  title: "Fixture pack title",
  tagline: "Krátky fixture popis pre kartu.",
  industry: "eshop",
  industryEmoji: "🛒",
  targetPersona: "Persona",
  questionIds: ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"],
  passingThreshold: 75,
  publishedAt: "2026-04-27",
  updatedAt: "2026-04-27",
};

describe("TestPackCard", () => {
  it("renders title, tagline, emoji, industry label, and meta", () => {
    render(<TestPackCard pack={fixture} />);
    expect(screen.getByText("Fixture pack title")).toBeInTheDocument();
    expect(screen.getByText("Krátky fixture popis pre kartu.")).toBeInTheDocument();
    expect(screen.getByText("🛒")).toBeInTheDocument();
    expect(screen.getByText("E-shop")).toBeInTheDocument();
    expect(screen.getByText(/12 otázok/)).toBeInTheDocument();
    expect(screen.getByText(/≥ 75 %/)).toBeInTheDocument();
  });
});

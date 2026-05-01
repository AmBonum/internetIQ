import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PackPreloadChips } from "@/components/composer/build/PackPreloadChips";
import type { TestPack } from "@/content/test-packs";

const fixturePacks: TestPack[] = [
  {
    slug: "eshop",
    title: "E-shop",
    tagline: "x",
    industry: "eshop",
    industryEmoji: "🛒",
    targetPersona: "x",
    questionIds: Array.from({ length: 12 }, (_, i) => `q-eshop-${i}`),
    passingThreshold: 70,
    publishedAt: "2026-04-27",
    updatedAt: "2026-04-27",
  },
  {
    slug: "it-vyvoj",
    title: "IT vývoj",
    tagline: "x",
    industry: "it",
    industryEmoji: "💻",
    targetPersona: "x",
    questionIds: Array.from({ length: 15 }, (_, i) => `q-it-${i}`),
    passingThreshold: 75,
    publishedAt: "2026-04-27",
    updatedAt: "2026-04-27",
  },
];

describe("PackPreloadChips", () => {
  it("renders one button per pack with title + question count badge", () => {
    render(<PackPreloadChips packs={fixturePacks} selectedSlugs={new Set()} onToggle={vi.fn()} />);
    expect(screen.getByRole("button", { name: /E-shop/ })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /IT vývoj/ })).toBeInTheDocument();
    expect(screen.getByText("+12")).toBeInTheDocument();
    expect(screen.getByText("+15")).toBeInTheDocument();
  });

  it("aria-pressed reflects selectedSlugs", () => {
    render(
      <PackPreloadChips
        packs={fixturePacks}
        selectedSlugs={new Set(["it-vyvoj"])}
        onToggle={vi.fn()}
      />,
    );
    const eshop = screen.getByRole("button", { name: /E-shop/ });
    const it = screen.getByRole("button", { name: /IT vývoj/ });
    expect(eshop).toHaveAttribute("aria-pressed", "false");
    expect(it).toHaveAttribute("aria-pressed", "true");
  });

  it("calls onToggle with the pack slug on click", async () => {
    const onToggle = vi.fn();
    const user = userEvent.setup();
    render(<PackPreloadChips packs={fixturePacks} selectedSlugs={new Set()} onToggle={onToggle} />);
    await user.click(screen.getByRole("button", { name: /IT vývoj/ }));
    expect(onToggle).toHaveBeenCalledWith("it-vyvoj");
  });

  it("falls back to a friendly empty state when no packs are passed", () => {
    render(<PackPreloadChips packs={[]} selectedSlugs={new Set()} onToggle={vi.fn()} />);
    expect(screen.getByText(/Žiadne predefinované sady/i)).toBeInTheDocument();
  });
});

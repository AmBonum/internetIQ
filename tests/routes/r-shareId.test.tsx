import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";
import type { AnswerRecordPersisted } from "@/lib/quiz/schema";

const maybeSingleSpy = vi.fn();

vi.mock("@/integrations/supabase/client", () => {
  const eq = vi.fn(() => ({ maybeSingle: maybeSingleSpy }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));
  return { supabase: { from } };
});

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, ...rest }: { to: unknown; children: ReactNode } & ComponentProps<"a">) => (
    <a role="link" data-to={typeof to === "string" ? to : ""} {...rest}>
      {children}
    </a>
  ),
  createFileRoute:
    () =>
    <T,>(opts: T) =>
      opts,
}));

import { SharePage } from "@/routes/r.$shareId";

function makeAnswer(
  i: number,
  overrides: Partial<AnswerRecordPersisted> = {},
): AnswerRecordPersisted {
  return {
    questionId: `q-iq-bb-${i.toString().padStart(3, "0")}`,
    optionId: "a",
    correct: true,
    severity: null,
    responseMs: 3000 + i * 100,
    category: "phishing",
    difficulty: "easy",
    ...overrides,
  };
}

const baseAttempt = {
  share_id: "ABC12345",
  final_score: 75,
  percentile: 70,
  personality: "internet_ninja",
  breakdown: { phishing: 80, url: 70, fake_vs_real: 60, scenario: 90 },
  insights: ["Insight A"],
  stats: {
    criticalMistakes: 0,
    mediumMistakes: 0,
    minorMistakes: 0,
    avgResponseMs: 4000,
    totalTimeMs: 60_000,
  },
  created_at: "2026-04-26T00:00:00Z",
};

beforeEach(() => {
  maybeSingleSpy.mockReset();
});

describe("SharePage — answer review (E3.3)", () => {
  it("hides review cards until the toggle is clicked (lazy render)", async () => {
    maybeSingleSpy.mockResolvedValue({
      data: { ...baseAttempt, answers: Array.from({ length: 15 }, (_, i) => makeAnswer(i)) },
      error: null,
    });

    render(<SharePage shareId="ABC12345" />);

    const toggle = await screen.findByRole("button", { name: /Pozri si moje odpovede \(15\)/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls", "review-section");
    // Pre-expand: the section is `hidden` (so role=region is removed from
    // the a11y tree) and no review cards are mounted in the DOM.
    expect(document.getElementById("review-section")).toHaveAttribute("hidden");
    expect(screen.queryByText(/Otázka 1 \/ 15/)).not.toBeInTheDocument();

    fireEvent.click(toggle);

    await waitFor(() => expect(toggle).toHaveAttribute("aria-expanded", "true"));
    expect(
      await screen.findByRole("region", { name: /Detail odpovedí — 15 odpovedí dostupných/i }),
    ).not.toHaveAttribute("hidden");
    expect(await screen.findByText(/Otázka 1 \/ 15/)).toBeInTheDocument();
  });

  it("renders the legacy fallback when answers is an empty array", async () => {
    maybeSingleSpy.mockResolvedValue({ data: { ...baseAttempt, answers: [] }, error: null });

    render(<SharePage shareId="ABC12345" />);

    const toggle = await screen.findByRole("button", { name: /Pozri si moje odpovede/i });
    fireEvent.click(toggle);

    await waitFor(() =>
      expect(
        screen.getByText(/Detail odpovedí nie je dostupný pre staré výsledky/),
      ).toBeInTheDocument(),
    );
  });

  it("uses Zod fallback (== empty) when answers field is malformed", async () => {
    maybeSingleSpy.mockResolvedValue({
      data: { ...baseAttempt, answers: "not an array" },
      error: null,
    });

    render(<SharePage shareId="ABC12345" />);

    const toggle = await screen.findByRole("button", { name: /Pozri si moje odpovede/i });
    fireEvent.click(toggle);

    await waitFor(() =>
      expect(screen.getByText(/Detail odpovedí nie je dostupný/)).toBeInTheDocument(),
    );
  });

  it("renders the not-found state when the supabase row does not exist", async () => {
    maybeSingleSpy.mockResolvedValue({ data: null, error: null });

    render(<SharePage shareId="MISSING1" />);

    expect(await screen.findByText(/Výsledok neexistuje/i)).toBeInTheDocument();
  });
});

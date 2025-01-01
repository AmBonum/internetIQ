import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";
import type { AnswerRecord, ScoreResult } from "@/lib/quiz/scoring";
import { ConsentProvider } from "@/hooks/useConsent";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({ insert: vi.fn().mockResolvedValue({ error: null }) })),
  },
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children, ...rest }: { children: ReactNode } & ComponentProps<"a">) => (
    <a {...rest}>{children}</a>
  ),
}));

vi.mock("@/lib/quiz/share-image", () => ({
  drawIgStoryToCanvas: vi.fn(),
}));

vi.mock("@/components/quiz/SurveyCard", () => ({
  SurveyCard: () => null,
}));

import { ResultsView } from "@/components/quiz/ResultsView";

function makeAnswer(i: number): AnswerRecord {
  return {
    questionId: `q-iq-bb-${i.toString().padStart(3, "0")}`,
    optionId: "a",
    correct: true,
    severity: null,
    responseMs: 3000 + i * 100,
    category: "phishing",
    difficulty: "medium",
  };
}

const baseResult: ScoreResult = {
  baseScore: 80,
  finalScore: 75,
  totalPenalty: 5,
  percentile: 70,
  personality: "internet_ninja",
  breakdown: { phishing: 80, url: 70, fake_vs_real: 60, scenario: 90 },
  insights: [],
  stats: {
    criticalMistakes: 0,
    mediumMistakes: 1,
    minorMistakes: 0,
    avgResponseMs: 4000,
    totalTimeMs: 60_000,
  },
  flags: [],
};

async function flushScoreAnimation() {
  // ResultsView reveals the share/review block after a setTimeout(duration+100ms).
  // Advance virtual timers so the second-stage UI mounts.
  await act(async () => {
    await vi.advanceTimersByTimeAsync(1300);
  });
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
});

function renderResults(result: ScoreResult, answers: AnswerRecord[]) {
  return render(
    <ConsentProvider>
      <ResultsView result={result} answers={answers} onRestart={() => {}} />
    </ConsentProvider>,
  );
}

describe("ResultsView — inline answer review (E3.4)", () => {
  it("renders a collapsible review toggle when answers are present", async () => {
    const answers = Array.from({ length: 5 }, (_, i) => makeAnswer(i));

    renderResults(baseResult, answers);
    await flushScoreAnimation();

    const toggle = await screen.findByRole("button", { name: /Pozri si svoje odpovede \(5\)/i });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(toggle).toHaveAttribute("aria-controls", "results-review-section");

    // Pre-expand: section is hidden, no review cards in DOM.
    const section = document.getElementById("results-review-section");
    expect(section).toHaveAttribute("hidden");
    expect(screen.queryByText(/Otázka 1 \/ 5/)).not.toBeInTheDocument();
  });

  it("expands the section on click and lazy-mounts the review cards", async () => {
    const answers = Array.from({ length: 3 }, (_, i) => makeAnswer(i));

    renderResults(baseResult, answers);
    await flushScoreAnimation();

    const toggle = await screen.findByRole("button", { name: /Pozri si svoje odpovede \(3\)/i });
    fireEvent.click(toggle);

    await waitFor(() => expect(toggle).toHaveAttribute("aria-expanded", "true"));
    expect(
      await screen.findByRole("region", { name: /Detail odpovedí — 3 odpovedí dostupných/i }),
    ).not.toHaveAttribute("hidden");
    expect(await screen.findByText(/Otázka 1 \/ 3/)).toBeInTheDocument();
  });

  it("hides the toggle entirely when answers is empty (no legacy fallback after a fresh test)", async () => {
    renderResults(baseResult, []);
    await flushScoreAnimation();

    expect(
      screen.queryByRole("button", { name: /Pozri si svoje odpovede/i }),
    ).not.toBeInTheDocument();
  });

  it("does not render the legacy share-page Link CTA (review is now inline)", async () => {
    const answers = [makeAnswer(0)];

    renderResults(baseResult, answers);
    await flushScoreAnimation();

    // Old "🔍 Pozri si svoje odpovede" anchor (link to /r/$shareId) must be gone —
    // the inline button replaces it.
    expect(screen.queryByText(/🔍 Pozri si svoje odpovede/)).not.toBeInTheDocument();
  });
});

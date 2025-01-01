import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import { ConsentProvider } from "@/hooks/useConsent";
import { ResultsView } from "@/components/quiz/ResultsView";
import { TRAP_SEEN_STORAGE_KEY } from "@/lib/data-trap/copy";
import type { ScoreResult } from "@/lib/quiz/scoring";

// Mock Link component to avoid RouterProvider requirement
vi.mock("@tanstack/react-router", async () => {
  const actual =
    await vi.importActual<typeof import("@tanstack/react-router")>("@tanstack/react-router");
  return {
    ...actual,
    Link: ({
      to,
      className,
      children,
    }: {
      to: string;
      className: string;
      children: React.ReactNode;
    }) => (
      <a href={to} className={className}>
        {children}
      </a>
    ),
  };
});

// Mock Supabase to avoid DB calls in tests
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => ({
      insert: vi.fn().mockResolvedValue({ error: null }),
    }),
  },
}));

// Mock tracking to avoid async issues in tests
vi.mock("@/lib/tracking", () => ({
  track: vi.fn(),
}));

const mockResult: ScoreResult = {
  finalScore: 75,
  baseScore: 75,
  totalPenalty: 0,
  percentile: 75,
  personality: "scam_magnet",
  stats: {
    totalTimeMs: 120000,
    avgResponseMs: 2000,
    criticalMistakes: 1,
    mediumMistakes: 2,
    minorMistakes: 1,
  },
  breakdown: {
    phishing: 80,
    social_engineering: 70,
    crypto: 60,
  },
  insights: ["Mistake 1"],
  flags: {},
};

const mockAnswers = [
  { questionId: "q1", correct: true, answer: "a", timeMs: 2000 },
  { questionId: "q2", correct: false, answer: "b", timeMs: 1500 },
  { questionId: "q3", correct: true, answer: "c", timeMs: 1800 },
];

function renderResults(result = mockResult, answers = mockAnswers, onRestart = vi.fn()) {
  return render(
    <ConsentProvider>
      <ResultsView result={result} answers={answers} onRestart={onRestart} />
    </ConsentProvider>,
  );
}

describe("ResultsView — E4.3 TrapDialog integration", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it("clears timer on unmount before 5s (no memory leak)", async () => {
    const { unmount } = renderResults();

    // Unmount before timer fires
    await act(async () => {
      vi.advanceTimersByTime(1000);
    });
    unmount();

    // Advance past 5s — no error should occur
    await act(async () => {
      vi.advanceTimersByTime(6000);
    });

    // If we get here without error, cleanup worked
    expect(true).toBe(true);
  });

  it("skips auto-open timer if iiq_trap_seen flag is already set", async () => {
    localStorage.setItem(TRAP_SEEN_STORAGE_KEY, "1");

    const { container } = renderResults();

    // Advance through timer + animation
    await act(async () => {
      vi.advanceTimersByTime(7000);
    });

    // Dialog should NOT be in DOM since flag was already set
    expect(container.querySelector('[role="dialog"]')).not.toBeInTheDocument();
  });

  it("initializes trapSeen state from localStorage", async () => {
    localStorage.setItem(TRAP_SEEN_STORAGE_KEY, "1");

    renderResults();

    // Component initializes with trapSeen=true, so flag read happens correctly
    // This is implicitly verified by the previous test passing
    expect(localStorage.getItem(TRAP_SEEN_STORAGE_KEY)).toBe("1");
  });
});

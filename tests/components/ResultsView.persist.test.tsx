import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import type { AnswerRecord, ScoreResult } from "@/lib/quiz/scoring";
import { ConsentProvider } from "@/hooks/useConsent";

const insertSpy = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: vi.fn(() => ({ insert: insertSpy })),
  },
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({ children }: { children: ReactNode }) => <a>{children}</a>,
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
    questionId: `q-${i.toString().padStart(3, "0")}`,
    optionId: "a",
    correct: true,
    severity: null,
    responseMs: 4000 + i,
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
  insights: ["Insight A", "Insight B"],
  stats: {
    criticalMistakes: 0,
    mediumMistakes: 1,
    minorMistakes: 0,
    avgResponseMs: 4000,
    totalTimeMs: 60_000,
  },
  flags: [],
};

beforeEach(() => {
  insertSpy.mockReset();
  insertSpy.mockResolvedValue({ error: null });
});

function renderResults(result: ScoreResult, answers: AnswerRecord[]) {
  return render(
    <ConsentProvider>
      <ResultsView result={result} answers={answers} onRestart={() => {}} />
    </ConsentProvider>,
  );
}

describe("ResultsView.persistResult — answers payload (E3.1)", () => {
  it("includes the full answers array in the supabase insert", async () => {
    const answers = Array.from({ length: 15 }, (_, i) => makeAnswer(i));

    renderResults(baseResult, answers);

    await waitFor(() => expect(insertSpy).toHaveBeenCalledTimes(1));

    const payload = insertSpy.mock.calls[0][0] as {
      answers: AnswerRecord[];
      final_score: number;
      share_id: string;
    };
    expect(payload.answers).toHaveLength(15);
    expect(payload.answers[0]).toEqual(answers[0]);
    expect(payload.final_score).toBe(baseResult.finalScore);
    expect(payload.share_id).toMatch(/^[A-Z0-9]{8}$/);
  });

  it("persists an empty answers array when no answers were collected (defensive)", async () => {
    renderResults(baseResult, []);

    await waitFor(() => expect(insertSpy).toHaveBeenCalledTimes(1));
    const payload = insertSpy.mock.calls[0][0] as { answers: AnswerRecord[] };
    expect(payload.answers).toEqual([]);
  });

  it("renders the score reveal even before the insert resolves", async () => {
    renderResults(baseResult, [makeAnswer(0)]);
    expect(screen.getByText(/Tvoj Internet IQ/i)).toBeInTheDocument();
  });
});

import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AnswerFeedback } from "@/components/quiz/review/AnswerFeedback";
import { deriveState } from "@/components/quiz/review/AnswerFeedback.helpers";
import type { Question } from "@/lib/quiz/bank/questions";

function makeQuestion(): Question {
  return {
    id: "q-test",
    category: "phishing",
    difficulty: "easy",
    prompt: "Je táto SMS od banky?",
    visual: { kind: "text", label: "SMS", body: "Klikni sem" },
    options: [
      { id: "a", label: "Áno", correct: false, severity: "critical" },
      { id: "b", label: "Nie, je to phishing", correct: true, severity: null },
    ],
    explanation: "Banka nikdy neposiela odkazy na klik.",
  };
}

describe("deriveState", () => {
  it("returns 'timeout' when selectedId is null", () => {
    expect(deriveState(makeQuestion(), null)).toBe("timeout");
  });

  it("returns 'correct' when the picked option is the correct one", () => {
    expect(deriveState(makeQuestion(), "b")).toBe("correct");
  });

  it("returns 'wrong' when the picked option is incorrect", () => {
    expect(deriveState(makeQuestion(), "a")).toBe("wrong");
  });

  it("returns 'wrong' when selectedId does not match any option (defensive)", () => {
    expect(deriveState(makeQuestion(), "zzz")).toBe("wrong");
  });
});

describe("AnswerFeedback — live mode", () => {
  it("shows the harsh timeout headline when selectedId is null", () => {
    render(<AnswerFeedback question={makeQuestion()} selectedId={null} mode="live" />);
    expect(screen.getByText(/Príliš pomaly/)).toBeInTheDocument();
    expect(screen.getByText(/Banka nikdy neposiela/)).toBeInTheDocument();
  });

  it("shows the correct headline for a right answer", () => {
    render(<AnswerFeedback question={makeQuestion()} selectedId="b" mode="live" />);
    expect(screen.getByText(/Správne\. Scammer si hľadá ďalšieho/)).toBeInTheDocument();
  });

  it("shows the wrong headline for an incorrect answer", () => {
    render(<AnswerFeedback question={makeQuestion()} selectedId="a" mode="live" />);
    expect(screen.getByText(/Ups\. Nalietol si/)).toBeInTheDocument();
  });
});

describe("AnswerFeedback — review mode", () => {
  it("uses neutral copy for a timed-out answer", () => {
    render(<AnswerFeedback question={makeQuestion()} selectedId={null} mode="review" />);
    expect(screen.getByText(/Nezodpovedané — vypršal čas/)).toBeInTheDocument();
    expect(screen.queryByText(/Scammer/)).not.toBeInTheDocument();
  });

  it("uses neutral copy for a correct answer", () => {
    render(<AnswerFeedback question={makeQuestion()} selectedId="b" mode="review" />);
    expect(screen.getByText(/Správna odpoveď/)).toBeInTheDocument();
    expect(screen.queryByText(/Scammer si hľadá/)).not.toBeInTheDocument();
  });

  it("uses neutral copy for a wrong answer", () => {
    render(<AnswerFeedback question={makeQuestion()} selectedId="a" mode="review" />);
    expect(screen.getByText(/Nesprávna odpoveď/)).toBeInTheDocument();
    expect(screen.queryByText(/Nalietol si/)).not.toBeInTheDocument();
  });
});

describe("AnswerFeedback — explanation always rendered", () => {
  it.each([
    ["live", null],
    ["live", "a"],
    ["live", "b"],
    ["review", null],
    ["review", "a"],
    ["review", "b"],
  ] as const)("renders explanation for mode=%s, selected=%s", (mode, picked) => {
    render(<AnswerFeedback question={makeQuestion()} selectedId={picked} mode={mode} />);
    expect(screen.getByText(/Banka nikdy neposiela/)).toBeInTheDocument();
  });
});

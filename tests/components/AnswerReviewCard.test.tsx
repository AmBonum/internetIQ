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

import { AnswerReviewCard } from "@/components/quiz/review/AnswerReviewCard";
import type { Question } from "@/lib/quiz/bank/questions";
import type { AnswerRecordPersisted } from "@/lib/quiz/bank/schema";

function makeQuestion(): Question {
  return {
    id: "q-1",
    category: "phishing",
    difficulty: "easy",
    prompt: "Je toto phishing?",
    visual: { kind: "text", label: "Email", body: "Klikni sem na overenie účtu." },
    options: [
      { id: "a", label: "Áno, je", correct: true, severity: null },
      { id: "b", label: "Nie", correct: false, severity: "critical" },
    ],
    explanation: "Banka nikdy nepýta heslo cez link.",
  };
}

function makeAnswer(over: Partial<AnswerRecordPersisted> = {}): AnswerRecordPersisted {
  return {
    questionId: "q-1",
    optionId: "a",
    correct: true,
    severity: null,
    responseMs: 4000,
    category: "phishing",
    difficulty: "easy",
    ...over,
  };
}

describe("AnswerReviewCard — happy paths", () => {
  it("renders prompt + visual + review-mode feedback", () => {
    render(
      <AnswerReviewCard answer={makeAnswer()} question={makeQuestion()} index={1} total={15} />,
    );
    expect(screen.getByText("Je toto phishing?")).toBeInTheDocument();
    expect(screen.getByText(/Klikni sem na overenie účtu/)).toBeInTheDocument();
    expect(screen.getByText(/Správna odpoveď/)).toBeInTheDocument();
    expect(screen.queryByText(/Scammer/)).not.toBeInTheDocument();
  });

  it("highlights the correct option AND tags the user's pick when both match", () => {
    render(
      <AnswerReviewCard answer={makeAnswer()} question={makeQuestion()} index={1} total={15} />,
    );
    expect(screen.getByText("tvoja odpoveď")).toBeInTheDocument();
    expect(screen.getByLabelText("správna odpoveď")).toBeInTheDocument();
  });

  it("marks a wrong pick with ❌ and shows wrong-answer feedback", () => {
    render(
      <AnswerReviewCard
        answer={makeAnswer({ optionId: "b", correct: false, severity: "critical" })}
        question={makeQuestion()}
        index={1}
        total={15}
      />,
    );
    expect(screen.getByLabelText("tvoja odpoveď")).toBeInTheDocument();
    expect(screen.getByText(/Nesprávna odpoveď/)).toBeInTheDocument();
  });

  it("shows the timeout review copy when optionId is null", () => {
    render(
      <AnswerReviewCard
        answer={makeAnswer({ optionId: null, correct: false, severity: "medium" })}
        question={makeQuestion()}
        index={1}
        total={15}
      />,
    );
    expect(screen.getByText(/Nezodpovedané — vypršal čas/)).toBeInTheDocument();
  });
});

describe("AnswerReviewCard — defensive paths", () => {
  it("renders fallback copy when the question has been removed from the bank", () => {
    render(<AnswerReviewCard answer={makeAnswer()} question={null} index={3} total={15} />);
    expect(screen.getByText(/Otázka už nie je dostupná/)).toBeInTheDocument();
    // The full review block should NOT be rendered.
    expect(screen.queryByText(/Správna odpoveď/)).not.toBeInTheDocument();
  });

  it("paints the time chip warning class when response is near the limit", () => {
    // Time limit for this short question is the 8s clamp; 7.5s is > 90%.
    render(
      <AnswerReviewCard
        answer={makeAnswer({ responseMs: 7500 })}
        question={makeQuestion()}
        index={1}
        total={15}
      />,
    );
    const chip = screen.getByText("7.5s");
    expect(chip.className).toMatch(/text-warning/);
  });
});

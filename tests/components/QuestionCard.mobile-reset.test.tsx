import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { QuestionCard } from "@/components/quiz/QuestionCard";
import type { Question } from "@/lib/quiz/questions";

// Two minimal questions. Identical option layout (a/b/c) — that's the
// whole point: mobile users tap the same DOM-position button across
// consecutive questions, so focus carry-over is the easy bug.
const Q1: Question = {
  id: "q1",
  category: "phishing",
  difficulty: "easy",
  prompt: "Prvá otázka",
  options: [
    { id: "a", label: "A1", correct: false, severity: "minor" },
    { id: "b", label: "B1", correct: true, severity: null },
    { id: "c", label: "C1", correct: false, severity: "minor" },
  ],
  explanation: "x",
};
const Q2: Question = {
  id: "q2",
  category: "phishing",
  difficulty: "easy",
  prompt: "Druhá otázka",
  options: [
    { id: "a", label: "A2", correct: false, severity: "minor" },
    { id: "b", label: "B2", correct: true, severity: null },
    { id: "c", label: "C2", correct: false, severity: "minor" },
  ],
  explanation: "x",
};

describe("QuestionCard — mobile UX reset on question change", () => {
  it("blurs the active element and resets scroll when question.id changes", () => {
    const scrollSpy = vi.spyOn(window, "scrollTo").mockImplementation(() => {});
    const onAnswer = vi.fn();

    const { rerender } = render(
      <QuestionCard question={Q1} index={0} total={2} onAnswer={onAnswer} />,
    );

    // Simulate the "carry-over" state a mobile tap leaves behind: option B
    // is the active element AND the page is scrolled away from the top.
    const buttonB = screen.getByRole("button", { name: /B1/ });
    buttonB.focus();
    expect(document.activeElement).toBe(buttonB);
    scrollSpy.mockClear();

    // Parent re-renders with the next question — same component instance,
    // new question.id. The reset effect must blur + scroll-to-top.
    act(() => {
      rerender(<QuestionCard question={Q2} index={1} total={2} onAnswer={onAnswer} />);
    });

    expect(document.activeElement).not.toBe(buttonB);
    expect(scrollSpy).toHaveBeenCalledWith(expect.objectContaining({ top: 0 }));
    scrollSpy.mockRestore();
  });
});

import { describe, it, expect } from "vitest";
import { computeScore, type AnswerRecord } from "@/lib/quiz/scoring";

const correct = (difficulty: AnswerRecord["difficulty"] = "medium"): AnswerRecord => ({
  questionId: `q-${Math.random()}`,
  optionId: "a",
  correct: true,
  severity: null,
  responseMs: 5000,
  category: "phishing",
  difficulty,
});

const wrong = (
  severity: Exclude<AnswerRecord["severity"], null> = "critical",
  difficulty: AnswerRecord["difficulty"] = "medium",
): AnswerRecord => ({
  questionId: `q-${Math.random()}`,
  optionId: "b",
  correct: false,
  severity,
  responseMs: 5000,
  category: "phishing",
  difficulty,
});

describe("computeScore — penalty cap", () => {
  it("never zeroes the score when at least half the answers are correct", () => {
    const answers = [
      ...Array.from({ length: 8 }, () => correct()),
      ...Array.from({ length: 7 }, () => wrong("critical")),
    ];
    const result = computeScore(answers);
    expect(result.finalScore).toBeGreaterThan(0);
    expect(result.baseScore).toBeGreaterThan(0);
  });

  it("caps penalty at 70% of baseScore", () => {
    const answers = [
      ...Array.from({ length: 5 }, () => correct()),
      ...Array.from({ length: 5 }, () => wrong("critical")),
    ];
    const result = computeScore(answers);
    expect(result.finalScore).toBeGreaterThanOrEqual(Math.round(result.baseScore * 0.3));
  });

  it("perfect score returns 100", () => {
    const answers = Array.from({ length: 10 }, () => correct("hard"));
    expect(computeScore(answers).finalScore).toBe(100);
  });

  it("all wrong answers still floor at 0, not negative", () => {
    const answers = Array.from({ length: 10 }, () => wrong("critical"));
    expect(computeScore(answers).finalScore).toBe(0);
  });
});

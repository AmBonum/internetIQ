import { describe, it, expect } from "vitest";
import { getTestQuestions, QUESTIONS } from "@/lib/quiz/questions";

describe("getTestQuestions", () => {
  it("returns exactly 15 questions", () => {
    const test = getTestQuestions();
    expect(test).toHaveLength(15);
  });

  it("caps honeypot at 4 of 15 (~27 %) across many random shuffles", () => {
    // Run 200 iterations to defeat shuffle luck — must hold every time.
    for (let i = 0; i < 200; i++) {
      const test = getTestQuestions();
      const honeypotCount = test.filter((q) => q.category === "honeypot").length;
      expect(honeypotCount).toBeLessThanOrEqual(4);
    }
  });

  it("every category appears at least once when bank is large enough", () => {
    const test = getTestQuestions();
    const cats = new Set(test.map((q) => q.category));
    expect(cats.size).toBeGreaterThanOrEqual(4);
  });

  it("never returns duplicates", () => {
    for (let i = 0; i < 50; i++) {
      const test = getTestQuestions();
      const ids = test.map((q) => q.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it("question bank has at least 42 honeypot items after E9.1 (+30 legit URLs)", () => {
    const honeypotInBank = QUESTIONS.filter((q) => q.category === "honeypot").length;
    expect(honeypotInBank).toBeGreaterThanOrEqual(42);
  });
});

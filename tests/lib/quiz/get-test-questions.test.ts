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

  it("question bank has at least 64 honeypot items after E9.1 + E9.2 (+30 URL, +20 SMS)", () => {
    const honeypotInBank = QUESTIONS.filter((q) => q.category === "honeypot").length;
    expect(honeypotInBank).toBeGreaterThanOrEqual(64);
  });

  it("E9.2 legit-SMS bank has exactly 20 questions (8 pošta + 6 banky + 4 úrady + 2 borderline)", () => {
    const e92 = QUESTIONS.filter(
      (q) =>
        q.id.startsWith("h-sms-posta-legit-") ||
        q.id.startsWith("h-sms-bank-legit-") ||
        q.id.startsWith("h-sms-urad-legit-") ||
        q.id.startsWith("h-sms-border-"),
    );
    expect(e92).toHaveLength(20);
    for (const q of e92) {
      expect(q.category).toBe("honeypot");
      expect(q.visual?.kind).toBe("sms");
      const wrongOpts = q.options.filter((o) => !o.correct);
      for (const o of wrongOpts) expect(o.severity).toBe("minor");
    }
  });
});

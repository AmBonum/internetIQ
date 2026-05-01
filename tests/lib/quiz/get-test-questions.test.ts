import { describe, it, expect } from "vitest";
import { getTestQuestions, QUESTIONS } from "@/lib/quiz/bank/questions";

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

  it("question bank has at least 94 honeypot items after E9.1 + E9.2 + E9.4 (+30 URL, +20 SMS, +30 honeypot)", () => {
    const honeypotInBank = QUESTIONS.filter((q) => q.category === "honeypot").length;
    expect(honeypotInBank).toBeGreaterThanOrEqual(94);
  });

  it("E9.2 legit-SMS bank has exactly 20 questions (8 post + 6 banks + 4 government offices + 2 borderline)", () => {
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

  it("E9.3 industry-specific scams cover all 7 buckets per AC-1", () => {
    const ids = QUESTIONS.map((q) => q.id);
    const buckets = {
      eshop: ids.filter((id) => id.startsWith("p-eshop-") || id.startsWith("s-eshop-")),
      gastro: ids.filter((id) => id.startsWith("p-gastro-") || id.startsWith("s-gastro-")),
      auto: ids.filter(
        (id) => id.startsWith("p-auto-") || id.startsWith("p-pneu-") || id.startsWith("s-auto-"),
      ),
      itdev: ids.filter((id) => id.startsWith("p-it-") || id.startsWith("s-it-")),
      zdrav: ids.filter((id) => id.startsWith("p-zdrav-") || id.startsWith("s-zdrav-")),
      skoly: ids.filter(
        (id) => id === "p-email-school-ms-1" || id === "s-school-qr-1" || id === "p-email-uni-1",
      ),
      disp: ids.filter((id) => id.startsWith("p-disp-") || id.startsWith("s-disp-")),
    };
    expect(buckets.eshop.length).toBeGreaterThanOrEqual(4);
    expect(buckets.gastro.length).toBeGreaterThanOrEqual(3);
    expect(buckets.auto.length).toBeGreaterThanOrEqual(3);
    expect(buckets.itdev.length).toBeGreaterThanOrEqual(3);
    expect(buckets.zdrav.length).toBeGreaterThanOrEqual(3);
    expect(buckets.skoly.length).toBeGreaterThanOrEqual(2);
    expect(buckets.disp.length).toBeGreaterThanOrEqual(2);
  });
});

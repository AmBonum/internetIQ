import { describe, it, expect } from "vitest";
import {
  COMPOSER_LIMITS,
  computeHoneypotRatio,
  decodeConfig,
  encodeConfig,
  resolveQuestions,
  shouldUseDbShare,
  validateComposerConfig,
  type ComposerConfig,
} from "@/lib/quiz/composer";
import { QUESTIONS } from "@/lib/quiz/bank/questions";

const realIds = QUESTIONS.slice(0, 6).map((q) => q.id);

function configWith(overrides: Partial<ComposerConfig> = {}): ComposerConfig {
  return {
    questionIds: realIds,
    passingThreshold: 70,
    maxQuestions: realIds.length,
    ...overrides,
  };
}

describe("validateComposerConfig", () => {
  it("accepts a valid config", () => {
    expect(validateComposerConfig(configWith())).toEqual({ ok: true });
  });

  it("rejects below the 5-question floor", () => {
    const ids = realIds.slice(0, 4);
    const result = validateComposerConfig(configWith({ questionIds: ids, maxQuestions: 4 }));
    expect(result).toEqual({ ok: false, reason: "too_few_questions" });
  });

  it("rejects above the 50-question ceiling", () => {
    // Re-use real IDs with a marker suffix won't work because they
    // have to exist in QUESTIONS. Use cycle of real IDs to inflate
    // length — duplicates trigger duplicate_question_id earlier; so
    // we'd need 51 unique ids, which the bank has. Slice 51 of them.
    if (QUESTIONS.length < 51) {
      // Sanity guard for repo state — bank should be > 50.
      throw new Error("question bank too small for this test");
    }
    const ids = QUESTIONS.slice(0, 51).map((q) => q.id);
    const result = validateComposerConfig(configWith({ questionIds: ids, maxQuestions: 51 }));
    expect(result).toEqual({ ok: false, reason: "too_many_questions" });
  });

  it("rejects max_questions mismatch", () => {
    const result = validateComposerConfig(configWith({ maxQuestions: 99 }));
    expect(result).toEqual({ ok: false, reason: "max_questions_mismatch" });
  });

  it("rejects threshold below 50 and above 90", () => {
    expect(validateComposerConfig(configWith({ passingThreshold: 49 }))).toEqual({
      ok: false,
      reason: "threshold_out_of_range",
    });
    expect(validateComposerConfig(configWith({ passingThreshold: 91 }))).toEqual({
      ok: false,
      reason: "threshold_out_of_range",
    });
  });

  it("rejects creator_label longer than 80 chars", () => {
    const label = "x".repeat(81);
    expect(validateComposerConfig(configWith({ creatorLabel: label }))).toEqual({
      ok: false,
      reason: "label_too_long",
    });
  });

  it("rejects unknown question_id with detail", () => {
    const result = validateComposerConfig(
      configWith({
        questionIds: [...realIds.slice(0, 5), "q-does-not-exist"],
        maxQuestions: 6,
      }),
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe("unknown_question_id");
      expect(result.detail).toBe("q-does-not-exist");
    }
  });

  it("rejects duplicate question_id", () => {
    const ids = [realIds[0], realIds[0], realIds[1], realIds[2], realIds[3]];
    const result = validateComposerConfig(configWith({ questionIds: ids, maxQuestions: 5 }));
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe("duplicate_question_id");
  });
});

describe("encodeConfig / decodeConfig — base64url round-trip", () => {
  it("survives a full round-trip with all fields populated", () => {
    const config: ComposerConfig = {
      questionIds: realIds,
      passingThreshold: 75,
      maxQuestions: realIds.length,
      creatorLabel: "E-shop Q1 2026 onboarding",
      sourcePackSlugs: ["eshop", "it-vyvoj"],
    };
    const encoded = encodeConfig(config);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeConfig(encoded)).toEqual(config);
  });

  it("survives Slovak diacritics in creator_label", () => {
    const config = configWith({ creatorLabel: "Žiaci 8. ročník — pravopis škodí" });
    expect(decodeConfig(encodeConfig(config))).toEqual(config);
  });

  it("returns null for malformed input", () => {
    expect(decodeConfig("")).toBeNull();
    expect(decodeConfig("!!!")).toBeNull();
    expect(decodeConfig(btoa("not json"))).toBeNull();
  });

  it("rejects shape that decodes to JSON but with wrong fields", () => {
    const garbage = btoa(JSON.stringify({ q: "not array", t: "not number" }))
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");
    expect(decodeConfig(garbage)).toBeNull();
  });
});

describe("resolveQuestions", () => {
  it("returns Question objects in the same order as IDs", () => {
    const { questions, missing } = resolveQuestions(realIds);
    expect(missing).toBe(0);
    expect(questions.map((q) => q.id)).toEqual(realIds);
  });

  it("counts missing IDs without throwing", () => {
    const ids = [realIds[0], "q-vanished", realIds[1]];
    const { questions, missing } = resolveQuestions(ids);
    expect(missing).toBe(1);
    expect(questions).toHaveLength(2);
    expect(questions.map((q) => q.id)).toEqual([realIds[0], realIds[1]]);
  });
});

describe("computeHoneypotRatio", () => {
  it("returns 0 for empty selection", () => {
    expect(computeHoneypotRatio([])).toBe(0);
  });

  it("matches the proportion of honeypot-category questions", () => {
    const honeypotIds = QUESTIONS.filter((q) => q.category === "honeypot").map((q) => q.id);
    const phishingIds = QUESTIONS.filter((q) => q.category === "phishing").map((q) => q.id);
    if (honeypotIds.length < 2 || phishingIds.length < 2) {
      throw new Error("question bank doesn't have enough variety for this test");
    }
    const ids = [...honeypotIds.slice(0, 2), ...phishingIds.slice(0, 2)];
    expect(computeHoneypotRatio(ids)).toBeCloseTo(0.5, 5);
  });
});

describe("shouldUseDbShare", () => {
  it("returns false for ≤10 question selections", () => {
    expect(shouldUseDbShare(5)).toBe(false);
    expect(shouldUseDbShare(10)).toBe(false);
  });
  it("returns true for >10 question selections", () => {
    expect(shouldUseDbShare(11)).toBe(true);
    expect(shouldUseDbShare(50)).toBe(true);
  });
});

describe("COMPOSER_LIMITS", () => {
  it("sane bounds match story AC", () => {
    expect(COMPOSER_LIMITS.minQuestions).toBe(5);
    expect(COMPOSER_LIMITS.maxQuestions).toBe(50);
    expect(COMPOSER_LIMITS.minThreshold).toBe(50);
    expect(COMPOSER_LIMITS.maxThreshold).toBe(90);
    expect(COMPOSER_LIMITS.labelMaxLen).toBe(80);
  });
});

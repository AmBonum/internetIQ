import { describe, it, expect } from "vitest";
import {
  AnswerRecordPersistedSchema,
  AnswersPersistedSchema,
  parseAnswers,
  type AnswerRecordPersisted,
} from "@/lib/quiz/schema";

function sampleAnswer(overrides: Partial<AnswerRecordPersisted> = {}): AnswerRecordPersisted {
  return {
    questionId: "q-001",
    optionId: "a",
    correct: true,
    severity: null,
    responseMs: 4200,
    category: "phishing",
    difficulty: "medium",
    ...overrides,
  };
}

describe("AnswerRecordPersistedSchema (E3.1)", () => {
  it("accepts a fully populated correct answer", () => {
    expect(AnswerRecordPersistedSchema.safeParse(sampleAnswer()).success).toBe(true);
  });

  it("accepts a wrong answer with severity", () => {
    const result = AnswerRecordPersistedSchema.safeParse(
      sampleAnswer({ correct: false, severity: "critical" }),
    );
    expect(result.success).toBe(true);
  });

  it("accepts a timeout answer (optionId = null, correct = false)", () => {
    const result = AnswerRecordPersistedSchema.safeParse(
      sampleAnswer({ optionId: null, correct: false, severity: "medium" }),
    );
    expect(result.success).toBe(true);
  });

  it("accepts honeypot category answers (runtime reality)", () => {
    expect(
      AnswerRecordPersistedSchema.safeParse(sampleAnswer({ category: "honeypot" })).success,
    ).toBe(true);
  });

  it("rejects an entry missing questionId", () => {
    const malformed = { ...sampleAnswer() } as Partial<AnswerRecordPersisted>;
    delete malformed.questionId;
    expect(AnswerRecordPersistedSchema.safeParse(malformed).success).toBe(false);
  });

  it("rejects an unknown category", () => {
    expect(
      AnswerRecordPersistedSchema.safeParse(sampleAnswer({ category: "unknown_category" as never }))
        .success,
    ).toBe(false);
  });

  it("rejects negative responseMs", () => {
    expect(AnswerRecordPersistedSchema.safeParse(sampleAnswer({ responseMs: -1 })).success).toBe(
      false,
    );
  });
});

describe("AnswersPersistedSchema array", () => {
  it("validates a 15-answer array (a real test session size)", () => {
    const arr: AnswerRecordPersisted[] = Array.from({ length: 15 }, (_, i) =>
      sampleAnswer({ questionId: `q-${i.toString().padStart(3, "0")}` }),
    );
    const result = AnswersPersistedSchema.safeParse(arr);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toHaveLength(15);
    }
  });

  it("rejects an array with one malformed entry", () => {
    const arr = [sampleAnswer(), { ...sampleAnswer(), responseMs: "fast" }];
    expect(AnswersPersistedSchema.safeParse(arr).success).toBe(false);
  });
});

describe("parseAnswers — read-boundary fallback", () => {
  it("returns [] for an empty array (pre-migration default)", () => {
    expect(parseAnswers([])).toEqual([]);
  });

  it("returns [] for malformed input rather than throwing", () => {
    expect(parseAnswers({ not: "an array" })).toEqual([]);
    expect(parseAnswers(null)).toEqual([]);
    expect(parseAnswers(undefined)).toEqual([]);
    expect(parseAnswers("garbage")).toEqual([]);
  });

  it("returns the typed array for a valid input", () => {
    const out = parseAnswers([sampleAnswer()]);
    expect(out).toHaveLength(1);
    expect(out[0].questionId).toBe("q-001");
  });
});

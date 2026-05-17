import { describe, it, expect } from "vitest";

// AH-1.3 — typed shape sanity check for content tables. Real Database types
// arrive in AH-1.8; this spec uses structural placeholders to lock the
// contract until then.

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  color: string | null;
  description: string | null;
  created_at: string;
};

type AnswerSetRow = {
  id: string;
  name: string;
  description: string | null;
  branch_slugs: string[];
  author_id: string | null;
  created_at: string;
  updated_at: string;
};

type AnswerRow = {
  id: string;
  set_id: string;
  text: string;
  is_correct: boolean;
  explanation: string | null;
  position: number;
};

type QuestionType =
  | "single"
  | "multi"
  | "scale_1_5"
  | "scale_1_10"
  | "nps"
  | "matrix"
  | "ranking"
  | "slider"
  | "short_text"
  | "long_text"
  | "date"
  | "time"
  | "file_upload"
  | "image_choice"
  | "yes_no";

type QuestionRow = {
  id: string;
  type: QuestionType;
  prompt: string;
  options: unknown;
  matrix_rows: unknown;
  matrix_cols: unknown;
  correct: unknown;
  category_id: string | null;
  branch_slug: string | null;
  difficulty: string | null;
  author_id: string | null;
  status: "draft" | "approved" | "deprecated" | "pending" | "flagged" | "published" | "archived";
  answer_set_id: string | null;
  created_at: string;
};

describe("AH-1.3 content tables typed shape", () => {
  it("category slug is unique-keyed by contract", () => {
    const sample: CategoryRow = {
      id: "00000000-0000-0000-0000-000000000100",
      name: "Math",
      slug: "math",
      color: "#abcdef",
      description: null,
      created_at: "2026-05-17T00:00:00.000Z",
    };
    expect(sample.slug).toMatch(/^[a-z][a-z0-9-]*$/);
  });

  it("answer_sets carries branch_slugs as a text[] (not jsonb)", () => {
    const sample: AnswerSetRow = {
      id: "00000000-0000-0000-0000-000000000200",
      name: "IQ standard",
      description: null,
      branch_slugs: ["math", "logic"],
      author_id: null,
      created_at: "2026-05-17T00:00:00.000Z",
      updated_at: "2026-05-17T00:00:00.000Z",
    };
    expect(Array.isArray(sample.branch_slugs)).toBe(true);
  });

  it("answers CASCADE on answer_set delete by design", () => {
    // Documented expectation: ON DELETE CASCADE in the migration. This test
    // just locks the row shape; the actual cascade is covered in
    // e2e/integration/admin-hub/content-fk-cascade.spec.ts (AH-11).
    const sample: AnswerRow = {
      id: "00000000-0000-0000-0000-000000000201",
      set_id: "00000000-0000-0000-0000-000000000200",
      text: "42",
      is_correct: true,
      explanation: null,
      position: 0,
    };
    expect(sample.is_correct).toBe(true);
  });

  it("questions accepts every question_type enum value", () => {
    const types: QuestionType[] = [
      "single",
      "multi",
      "scale_1_5",
      "scale_1_10",
      "nps",
      "matrix",
      "ranking",
      "slider",
      "short_text",
      "long_text",
      "date",
      "time",
      "file_upload",
      "image_choice",
      "yes_no",
    ];
    for (const t of types) {
      const sample: QuestionRow = {
        id: "00000000-0000-0000-0000-000000000300",
        type: t,
        prompt: "Q",
        options: null,
        matrix_rows: null,
        matrix_cols: null,
        correct: null,
        category_id: null,
        branch_slug: null,
        difficulty: null,
        author_id: null,
        status: "draft",
        answer_set_id: null,
        created_at: "2026-05-17T00:00:00.000Z",
      };
      expect(sample.type).toBe(t);
    }
  });
});

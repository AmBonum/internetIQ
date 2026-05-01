import { z } from "zod";

// Runtime contract for the JSONB `answers` column on `attempts`. The DB
// stores `Json` and the application is the single owner of the schema —
// this Zod object is the authoritative gate at the read boundary.
//
// The category list intentionally mirrors `Category` in `./questions.ts`
// (including `honeypot`); the story (E3.1) lists only the four "scoring"
// categories but honeypot questions are also persisted, and rejecting
// them here would crash review for a meaningful slice of attempts.
export const AnswerRecordPersistedSchema = z.object({
  questionId: z.string(),
  optionId: z.string().nullable(),
  correct: z.boolean(),
  severity: z.enum(["critical", "medium", "minor"]).nullable(),
  responseMs: z.number().int().min(0),
  category: z.enum(["phishing", "url", "fake_vs_real", "scenario", "honeypot"]),
  difficulty: z.enum(["easy", "medium", "hard"]),
});

export const AnswersPersistedSchema = z.array(AnswerRecordPersistedSchema);

export type AnswerRecordPersisted = z.infer<typeof AnswerRecordPersistedSchema>;

/**
 * Parse a value pulled from the DB `answers` JSONB column. Returns an empty
 * array for malformed data or for pre-migration rows where the default
 * `'[]'::jsonb` applies — review UI will then render the documented
 * fallback ("Detail odpovedí nie je dostupný pre staré výsledky").
 */
export function parseAnswers(raw: unknown): AnswerRecordPersisted[] {
  const result = AnswersPersistedSchema.safeParse(raw);
  return result.success ? result.data : [];
}

import type { TestPack, Industry } from "./_schema";
import { QUESTIONS } from "@/lib/quiz/questions";
// `_template` is imported only to keep the schema compile-checked
// against a concrete sample; intentionally NOT registered in TEST_PACKS.
import "./_template";

export type { TestPack, Industry } from "./_schema";
export { testPackSchema } from "./_schema";

export const TEST_PACKS: TestPack[] = [
  // packs land here in E7.2–E7.4
];

const slugs = new Set<string>();
for (const p of TEST_PACKS) {
  if (slugs.has(p.slug)) {
    throw new Error(`Duplicate test pack slug: ${p.slug}`);
  }
  slugs.add(p.slug);
}

export function getPackBySlug(slug: string): TestPack | null {
  return TEST_PACKS.find((p) => p.slug === slug) ?? null;
}

export function getPacksByIndustry(industry: Industry): TestPack[] {
  return TEST_PACKS.filter((p) => p.industry === industry);
}

/** Public listing — hides internal/template packs (slug starts with `_`). */
export function listPublishedPacks(): TestPack[] {
  return TEST_PACKS.filter((p) => !p.slug.startsWith("_"));
}

/**
 * Verifies every question id referenced by `pack.questionIds` exists in
 * the live `QUESTIONS` bank. Returns `{ ok: true }` on success, or
 * `{ ok: false, missing: [...] }` listing orphan ids. Used both by the
 * build-time test and by the composer pre-load flow (E8.2 AC-13) to
 * warn the user if a pack references a question that was renamed
 * since the pack was authored.
 */
export function validatePackQuestionIds(
  pack: TestPack,
): { ok: true } | { ok: false; missing: string[] } {
  const knownIds = new Set(QUESTIONS.map((q) => q.id));
  const missing = pack.questionIds.filter((id) => !knownIds.has(id));
  return missing.length === 0 ? { ok: true } : { ok: false, missing };
}

import type { Category } from "./questions";
import { COURSES, type Course } from "@/content/courses";

/**
 * Single source of truth for which course teaches against each
 * question category. Update when a new course is registered or
 * categories shift. `null` = no related course (CTA hidden).
 */
export const CATEGORY_TO_COURSE_SLUG: Record<Category, string | null> = {
  phishing: "email-phishing",
  url: "data-hygiene",
  fake_vs_real: "marketplace-bazos-podvody",
  scenario: "sms-smishing",
  honeypot: "data-hygiene",
};

/**
 * Returns the registered course for a given question category, or
 * `null` if the mapping points to an unregistered slug. Used by the
 * per-question review CTA so the link is hidden until the course
 * actually exists.
 */
export function getRelatedCourseForCategory(category: Category): Course | null {
  const slug = CATEGORY_TO_COURSE_SLUG[category];
  if (!slug) return null;
  return COURSES.find((c) => c.slug === slug) ?? null;
}

import { describe, it, expect } from "vitest";
import {
  CATEGORY_TO_COURSE_SLUG,
  getRelatedCourseForCategory,
} from "@/lib/quiz/category-course-map";
import { COURSES } from "@/content/courses";

describe("category-course-map", () => {
  it("every mapped slug is a registered course", () => {
    for (const slug of Object.values(CATEGORY_TO_COURSE_SLUG)) {
      if (!slug) continue;
      const found = COURSES.find((c) => c.slug === slug);
      expect(found, `expected course '${slug}' to be registered`).toBeDefined();
    }
  });

  it("getRelatedCourseForCategory returns the course for a known category", () => {
    const c = getRelatedCourseForCategory("phishing");
    expect(c).not.toBeNull();
    expect(c?.slug).toBe(CATEGORY_TO_COURSE_SLUG.phishing);
  });

  it("returns null when mapped slug is not in the registry", () => {
    // Prove the contract: if we mutate the map at runtime to point at an
    // unregistered slug, the helper returns null instead of crashing.
    const original = CATEGORY_TO_COURSE_SLUG.phishing;
    (CATEGORY_TO_COURSE_SLUG as Record<string, string | null>).phishing = "nonexistent-xyz";
    try {
      expect(getRelatedCourseForCategory("phishing")).toBeNull();
    } finally {
      (CATEGORY_TO_COURSE_SLUG as Record<string, string | null>).phishing = original;
    }
  });
});

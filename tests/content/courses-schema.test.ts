import { describe, it, expect } from "vitest";
import { COURSES, courseSchema, getCourseBySlug, getCoursesByCategory } from "@/content/courses";
import { demoCourse } from "@/content/courses/_demo";

describe("course content registry", () => {
  it("demo course parses through Zod schema (compile-time + runtime check)", () => {
    expect(() => courseSchema.parse(demoCourse)).not.toThrow();
  });

  it("every registered course parses through Zod schema", () => {
    for (const c of COURSES) {
      expect(() => courseSchema.parse(c)).not.toThrow();
    }
  });

  it("slugs are unique across the registry", () => {
    const seen = new Set<string>();
    for (const c of COURSES) {
      expect(seen.has(c.slug)).toBe(false);
      seen.add(c.slug);
    }
  });

  it("every source URL is a valid URL", () => {
    for (const c of [...COURSES, demoCourse]) {
      for (const s of c.sources ?? []) {
        expect(() => new URL(s.url)).not.toThrow();
      }
    }
  });

  it("getCourseBySlug returns null for unknown slug", () => {
    expect(getCourseBySlug("nonexistent-course-xyz")).toBeNull();
  });

  it("getCoursesByCategory returns only matching category (or empty)", () => {
    const generic = getCoursesByCategory("obecne");
    expect(generic.every((c) => c.category === "obecne")).toBe(true);
  });
});

import type { Course, CourseCategory } from "./_schema";
// `_demo` is imported only to keep the schema compile-checked against a
// concrete sample; it is intentionally NOT registered in COURSES.
import "./_demo";
import { smsSmishingCourse } from "./sms-smishing";
import { emailPhishingCourse } from "./email-phishing";
import { vishingCourse } from "./vishing";
import { marketplaceCourse } from "./marketplace-podvody";
import { dataHygieneCourse } from "./data-hygiene";

export type { Course, CourseCategory, CourseSection, CourseDifficulty } from "./_schema";
export { courseSchema } from "./_schema";

export const COURSES: Course[] = [
  smsSmishingCourse,
  emailPhishingCourse,
  vishingCourse,
  marketplaceCourse,
  dataHygieneCourse,
];

const slugs = new Set<string>();
for (const c of COURSES) {
  if (slugs.has(c.slug)) {
    throw new Error(`Duplicate course slug: ${c.slug}`);
  }
  slugs.add(c.slug);
}

export function getCourseBySlug(slug: string): Course | null {
  return COURSES.find((c) => c.slug === slug) ?? null;
}

export function getCoursesByCategory(category: CourseCategory): Course[] {
  return COURSES.filter((c) => c.category === category);
}

import type { Course } from "@/content/courses";

const SITE_ORIGIN = "https://internetiq.lvtesting.eu";
const PUBLISHER_NAME = "Internet IQ Test";

/**
 * Build a Schema.org Course JSON-LD object suitable for stringifying
 * into a `<script type="application/ld+json">` tag. Matches Google's
 * "Course" rich-result requirements (name, description, provider).
 */
export function buildCourseJsonLd(course: Course): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Course",
    name: course.title,
    description: course.tagline,
    inLanguage: "sk-SK",
    isAccessibleForFree: true,
    educationalLevel: course.difficulty,
    timeRequired: `PT${course.estimatedMinutes}M`,
    url: `${SITE_ORIGIN}/kurzy/${course.slug}`,
    datePublished: course.publishedAt,
    dateModified: course.updatedAt,
    provider: {
      "@type": "Organization",
      name: PUBLISHER_NAME,
      url: SITE_ORIGIN,
    },
    hasCourseInstance: {
      "@type": "CourseInstance",
      courseMode: "online",
      courseWorkload: `PT${course.estimatedMinutes}M`,
    },
    license: `${SITE_ORIGIN}/privacy`,
  };
}

import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { getCourseBySlug } from "@/content/courses";
import { CourseHero } from "@/components/courses/CourseHero";
import { CourseSectionView } from "@/components/courses/sections/CourseSections";
import { RelatedCourses } from "@/components/courses/RelatedCourses";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";
import { buildCourseJsonLd } from "@/lib/seo/course-jsonld";

const SITE_ORIGIN = "https://internetiq.lvtesting.eu";
const COPYRIGHT_HOLDER = "Internet IQ Test";

export const Route = createFileRoute("/kurzy/$slug")({
  loader: ({ params }) => {
    const course = getCourseBySlug(params.slug);
    if (!course) throw notFound();
    return course;
  },
  head: ({ loaderData: course }) => {
    if (!course) return { meta: [] };
    const url = `${SITE_ORIGIN}/kurzy/${course.slug}`;
    return {
      meta: [
        { title: `${course.title} — Bezplatný kurz · Internet IQ Test` },
        { name: "description", content: course.tagline },
        { name: "author", content: COPYRIGHT_HOLDER },
        {
          name: "copyright",
          content: `© ${new Date(course.publishedAt).getFullYear()} ${COPYRIGHT_HOLDER}`,
        },
        { name: "robots", content: "index, follow, max-image-preview:large" },
        { name: "language", content: "sk-SK" },
        { property: "og:title", content: course.title },
        { property: "og:description", content: course.tagline },
        { property: "og:type", content: "article" },
        { property: "og:url", content: url },
        { property: "og:locale", content: "sk_SK" },
        { property: "og:site_name", content: "Internet IQ Test" },
        { property: "article:published_time", content: course.publishedAt },
        { property: "article:modified_time", content: course.updatedAt },
        { property: "article:author", content: COPYRIGHT_HOLDER },
        { property: "article:section", content: course.category },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: course.title },
        { name: "twitter:description", content: course.tagline },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(buildCourseJsonLd(course)),
        },
      ],
    };
  },
  component: CoursePage,
});

function CoursePage() {
  const course = Route.useLoaderData();
  const year = new Date(course.publishedAt).getFullYear();
  return (
    <article className="min-h-screen bg-background" itemScope itemType="https://schema.org/Course">
      <main className="mx-auto max-w-3xl px-4 pb-12 pt-12 sm:pt-16">
        <CourseHero course={course} />

        {course.sections.map((section, idx) => (
          <CourseSectionView key={idx} section={section} idx={idx} />
        ))}

        {course.sources && course.sources.length > 0 ? (
          <section aria-labelledby="sources-h" className="mt-12 border-t border-border/60 pt-6">
            <h2
              id="sources-h"
              className="text-sm font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Zdroje
            </h2>
            <ul className="mt-3 space-y-1 text-sm" role="list">
              {course.sources.map((s, i) => (
                <li key={i}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline underline-offset-2 hover:text-foreground"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div className="mt-12 flex flex-wrap gap-3 print:hidden">
          <Button asChild>
            <Link to="/test">Otestuj sa</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/kurzy">Späť na kurzy</Link>
          </Button>
        </div>

        <RelatedCourses current={course} />

        <p className="mt-10 border-t border-border/60 pt-4 text-center text-xs text-muted-foreground">
          © {year} {COPYRIGHT_HOLDER}. Obsah kurzu je chránený autorským zákonom č. 185/2015 Z. z.
          Šírenie a kopírovanie celých sekcií bez uvedenia zdroja a aktívneho odkazu na pôvodnú
          stránku je zakázané.
        </p>
      </main>
      <Footer />
    </article>
  );
}

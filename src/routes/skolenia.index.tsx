import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { COURSES } from "@/content/courses";
import type { CourseCategory } from "@/content/courses";
import { CourseCard } from "@/components/courses/CourseCard";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

const CATEGORY_LABEL: Record<CourseCategory, string> = {
  sms: "SMS",
  email: "Email",
  voice: "Telefón",
  marketplace: "Marketplace",
  investicie: "Investície",
  vztahy: "Vzťahy",
  data: "Data hygiene",
  obecne: "Všeobecné",
};

const SITE_ORIGIN = "https://subenai.lvtesting.eu";

export const Route = createFileRoute("/skolenia/")({
  head: () => {
    const url = `${SITE_ORIGIN}/kurzy`;
    return {
      meta: [
        { title: "Bezplatné školenia — subenai" },
        {
          name: "description",
          content:
            "Krátke bezplatné kurzy o phishingu, scam SMS, telefónnych podvodoch a ochrane osobných údajov. Praktické príklady zo slovenského prostredia.",
        },
        { name: "robots", content: "index, follow, max-image-preview:large" },
        { property: "og:title", content: "Bezplatné školenia — subenai" },
        {
          property: "og:description",
          content: "Krátke bezplatné kurzy o digitálnej obozretnosti — slovenský kontext.",
        },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { property: "og:locale", content: "sk_SK" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: "Bezplatné kurzy o digitálnej obozretnosti",
            itemListElement: COURSES.map((c, i) => ({
              "@type": "ListItem",
              position: i + 1,
              url: `${SITE_ORIGIN}/kurzy/${c.slug}`,
              name: c.title,
            })),
          }),
        },
      ],
    };
  },
  component: CoursesIndexPage,
});

function CoursesIndexPage() {
  const [activeCategories, setActiveCategories] = useState<Set<CourseCategory>>(new Set());

  const availableCategories = useMemo(() => {
    const seen = new Set<CourseCategory>();
    for (const c of COURSES) seen.add(c.category);
    return [...seen];
  }, []);

  const filtered = useMemo(() => {
    if (activeCategories.size === 0) return COURSES;
    return COURSES.filter((c) => activeCategories.has(c.category));
  }, [activeCategories]);

  function toggleCategory(cat: CourseCategory) {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-5xl px-4 pb-12 pt-12 sm:pt-16">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-black sm:text-5xl">Bezplatné školenia</h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Krátke školenia o tom, ako rozoznať najčastejšie podvody na slovenskom internete. Žiadna
            registrácia, žiadne reklamy. 5 – 20 minút na školenie.
          </p>
        </header>

        {availableCategories.length > 1 && (
          <section
            aria-labelledby="filters-h"
            className="mb-8 rounded-2xl border border-border/60 bg-card/30 p-4"
          >
            <h2
              id="filters-h"
              className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Filter podľa témy
            </h2>
            <div className="flex flex-wrap gap-2">
              {availableCategories.map((cat) => {
                const active = activeCategories.has(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    aria-pressed={active}
                    className={`rounded-full border px-3 py-1.5 text-sm transition ${
                      active
                        ? "border-primary bg-primary/15 text-primary"
                        : "border-border/60 bg-background/40 text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    {CATEGORY_LABEL[cat]}
                  </button>
                );
              })}
              {activeCategories.size > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveCategories(new Set())}
                  className="ml-auto text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                >
                  Vyčistiť ({activeCategories.size})
                </button>
              )}
            </div>
          </section>
        )}

        {filtered.length === 0 ? (
          <p className="text-center text-muted-foreground">Žiadne školenia pre vybraté filtre.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((c) => (
              <CourseCard key={c.slug} course={c} />
            ))}
          </div>
        )}

        <div className="mt-12 flex justify-center">
          <Button asChild>
            <Link to="/test">Otestuj sa (cca 90 sekúnd)</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}

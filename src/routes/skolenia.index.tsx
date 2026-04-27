import { createFileRoute, Link } from "@tanstack/react-router";
import { COURSES } from "@/content/courses";
import { CourseCard } from "@/components/courses/CourseCard";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";

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
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-5xl px-4 pb-12 pt-12 sm:pt-16">
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-black sm:text-5xl">Bezplatné školenia</h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">
            Krátke školenia o tom, ako rozoznať najčastejšie podvody na slovenskom internete. Žiadna
            registrácia, žiadne reklamy. 5 – 10 minút na školenie.
          </p>
        </header>

        {COURSES.length === 0 ? (
          <p className="text-center text-muted-foreground">Školenia sa pripravujú.</p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {COURSES.map((c) => (
              <CourseCard key={c.slug} course={c} />
            ))}
          </div>
        )}

        <div className="mt-12 flex justify-center">
          <Button asChild>
            <Link to="/test">Otestuj sa najprv (90 sekúnd)</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
}

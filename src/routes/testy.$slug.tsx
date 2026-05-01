import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { getPackBySlug, type TestPack } from "@/content/test-packs";
import { getQuestionById, type Question } from "@/lib/quiz/bank/questions";
import { TestFlow } from "@/components/quiz/flow/TestFlow";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/layout/Footer";
import { buildPackQuizJsonLd, INDUSTRY_LABEL } from "@/lib/seo/quiz-jsonld";
import { SITE_ORIGIN } from "@/config/site";
const COPYRIGHT_HOLDER = "am.bonum s. r. o.";

export const Route = createFileRoute("/testy/$slug")({
  loader: ({ params }) => {
    const pack = getPackBySlug(params.slug);
    if (!pack) throw notFound();
    return pack;
  },
  head: ({ loaderData: pack }) => {
    if (!pack) return { meta: [] };
    const url = `${SITE_ORIGIN}/testy/${pack.slug}`;
    return {
      meta: [
        { title: `${pack.title} — subenai pre ${INDUSTRY_LABEL[pack.industry]}` },
        { name: "description", content: pack.tagline },
        { name: "author", content: COPYRIGHT_HOLDER },
        { name: "robots", content: "index, follow, max-image-preview:large" },
        { name: "language", content: "sk-SK" },
        { property: "og:title", content: pack.title },
        { property: "og:description", content: pack.tagline },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        { property: "og:locale", content: "sk_SK" },
        { property: "og:site_name", content: "subenai" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: pack.title },
        { name: "twitter:description", content: pack.tagline },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify(buildPackQuizJsonLd(pack)),
        },
      ],
    };
  },
  component: PackPage,
});

function PackPage() {
  const pack = Route.useLoaderData() as TestPack;
  const [started, setStarted] = useState(false);

  // Resolve questionIds -> Question[] once. If any id is missing we
  // gracefully filter (silent during runtime; build-time test catches it).
  const questions = useMemo<Question[]>(
    () =>
      pack.questionIds.map((id) => getQuestionById(id)).filter((q): q is Question => q !== null),
    [pack.questionIds],
  );

  if (started) {
    return (
      <div className="min-h-screen bg-hero">
        <TestFlow
          config={{
            kind: "pack",
            questions,
            passingThreshold: pack.passingThreshold,
            label: INDUSTRY_LABEL[pack.industry],
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-3xl px-4 pb-12 pt-12 sm:pt-16">
        <header className="text-center">
          <div className="text-7xl">{pack.industryEmoji}</div>
          <h1 className="mt-4 text-3xl font-black sm:text-4xl">{pack.title}</h1>
          <p className="mx-auto mt-3 max-w-2xl text-base text-muted-foreground sm:text-lg">
            {pack.tagline}
          </p>
          <p className="mt-4 text-sm text-muted-foreground">{pack.targetPersona}</p>
          <p className="mt-4 text-sm text-muted-foreground">
            <span aria-label="Počet otázok">📋 {questions.length} otázok</span>
            {" · "}
            <span>Vyhovenie pri ≥ {pack.passingThreshold} %</span>
            {" · "}
            <span>{INDUSTRY_LABEL[pack.industry]}</span>
          </p>
        </header>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" onClick={() => setStarted(true)} disabled={questions.length === 0}>
            Spustiť pack →
          </Button>
          <Button asChild variant="outline">
            <Link to="/test">Štandardný test</Link>
          </Button>
        </div>

        {questions.length === 0 && (
          <p className="mt-6 text-center text-sm text-warning">
            Pack momentálne neobsahuje žiadnu otázku. Kontaktuj autora.
          </p>
        )}

        {pack.sources && pack.sources.length > 0 && (
          <section
            aria-labelledby="pack-sources-h"
            className="mt-12 border-t border-border/60 pt-6"
          >
            <h2
              id="pack-sources-h"
              className="text-sm font-semibold uppercase tracking-wider text-muted-foreground"
            >
              Zdroje
            </h2>
            <ul className="mt-3 space-y-1 text-sm" role="list">
              {pack.sources.map((s, i) => (
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
        )}

        <p className="mt-10 border-t border-border/60 pt-4 text-center text-xs text-muted-foreground">
          © {new Date(pack.publishedAt).getFullYear()} {COPYRIGHT_HOLDER}. Obsah packu je chránený
          autorským zákonom č. 185/2015 Z. z.
        </p>
      </main>
      <Footer />
    </div>
  );
}

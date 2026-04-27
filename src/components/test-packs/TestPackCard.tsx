import { Link } from "@tanstack/react-router";
import type { TestPack } from "@/content/test-packs";
import { INDUSTRY_LABEL } from "@/lib/seo/quiz-jsonld";

export function TestPackCard({ pack }: { pack: TestPack }) {
  return (
    <Link
      to="/testy/$slug"
      params={{ slug: pack.slug }}
      className="group block rounded-2xl border border-border/60 bg-card/70 p-5 transition hover:border-primary/50 hover:bg-card focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
    >
      <div className="mb-3 flex items-start justify-between gap-3">
        <span className="text-4xl" aria-hidden="true">
          {pack.industryEmoji}
        </span>
        <span className="rounded-full border border-border/60 bg-background/40 px-2 py-0.5 text-xs text-muted-foreground">
          {INDUSTRY_LABEL[pack.industry]}
        </span>
      </div>
      <h3 className="text-lg font-bold text-foreground group-hover:text-primary">{pack.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm text-muted-foreground">{pack.tagline}</p>
      <p className="mt-3 text-xs text-muted-foreground">
        📋 {pack.questionIds.length} otázok · ≥ {pack.passingThreshold} %
      </p>
    </Link>
  );
}

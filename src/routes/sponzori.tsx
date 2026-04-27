import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { formatMonthYear } from "@/lib/sponsors";
import { SITE_ORIGIN, CONTACT_EMAIL } from "@/config/site";
import { ROUTES } from "@/config/routes";
const SPONZORI_URL = `${SITE_ORIGIN}/sponzori`;
const HOMEPAGE_LIMIT = 5;

export interface PublicSponsor {
  id: string;
  display_name: string;
  display_link: string | null;
  display_message: string | null;
  created_at: string;
}

export const Route = createFileRoute("/sponzori")({
  head: () => ({
    meta: [
      { title: "Naši sponzori — subenai" },
      {
        name: "description",
        content:
          "Verejný zoznam ľudí a firiem, ktorí finančne podporili projekt subenai a dali súhlas s uvedením mena.",
      },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "Naši sponzori — subenai" },
      { property: "og:url", content: SPONZORI_URL },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: SPONZORI_URL }],
  }),
  component: SponzoriPage,
});

function SponzoriPage() {
  return <SponzoriView fetchSponsors={fetchLatestSponsors} />;
}

interface SponzoriViewProps {
  fetchSponsors: () => Promise<PublicSponsor[]>;
}

export function SponzoriView({ fetchSponsors }: SponzoriViewProps) {
  const [state, setState] = useState<
    { kind: "loading" } | { kind: "ready"; sponsors: PublicSponsor[] } | { kind: "error" }
  >({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    fetchSponsors()
      .then((sponsors) => {
        if (!cancelled) setState({ kind: "ready", sponsors });
      })
      .catch(() => {
        if (!cancelled) setState({ kind: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [fetchSponsors]);

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
        <header className="mb-10">
          <Link to={ROUTES.home} className="text-sm text-muted-foreground hover:text-foreground">
            ← Späť na domov
          </Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Naši sponzori
          </h1>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            Vďaka týmto ľuďom funguje subenai. Detail kam idú peniaze v{" "}
            <Link
              to={ROUTES.oProjecte}
              className="underline underline-offset-2 hover:text-foreground"
            >
              O projekte
            </Link>
            .
          </p>
        </header>

        {state.kind === "loading" ? (
          <SponsorsLoading />
        ) : state.kind === "error" ? (
          <SponsorsError />
        ) : state.sponsors.length === 0 ? (
          <SponsorsEmpty />
        ) : (
          <LatestList sponsors={state.sponsors} />
        )}

        <p className="mt-12 text-center text-xs text-muted-foreground">
          Zoznam je dobrovoľný — mnohí sponzori si zvolili anonymitu a v zozname sa nenachádzajú.
          Žiadne sumy ani počty platieb tu neukazujeme. Súhlas so zverejnením môžeš odvolať e-mailom
          na{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-2">
            {CONTACT_EMAIL}
          </a>
          .
        </p>

        <Footer />
      </main>
    </div>
  );
}

function LatestList({ sponsors }: { sponsors: PublicSponsor[] }) {
  return (
    <section aria-labelledby="latest-h" className="space-y-6">
      <div className="flex items-baseline justify-between gap-4">
        <h2 id="latest-h" className="text-base font-semibold text-foreground">
          {sponsors.length === 1 ? "Najnovší sponzor" : `Najnovších ${sponsors.length} sponzorov`}
        </h2>
        <Link
          to={ROUTES.sponzoriVsetci}
          className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline underline-offset-2"
        >
          Celý zoznam s filtrami <span aria-hidden="true">→</span>
        </Link>
      </div>

      <Accordion
        type="multiple"
        className="overflow-hidden rounded-2xl border border-border/60 bg-card/40 px-5"
        aria-label="Najnovší sponzori"
      >
        {sponsors.map((s) => (
          <AccordionItem
            key={s.id}
            value={s.id}
            className="border-b border-border/40 last:border-b-0"
          >
            <AccordionTrigger className="flex-wrap text-left">
              <div className="flex flex-1 items-baseline justify-between gap-4 pr-3">
                <span className="text-base font-semibold text-foreground">{s.display_name}</span>
                <time
                  dateTime={s.created_at}
                  className="shrink-0 text-xs font-normal text-muted-foreground"
                >
                  {formatMonthYear(s.created_at)}
                </time>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pb-4 text-sm leading-relaxed text-muted-foreground">
              {s.display_message ? (
                <p className="mb-2">„{s.display_message}"</p>
              ) : (
                <p className="mb-2 italic text-muted-foreground/70">
                  Sponzor neuviedol verejnú správu.
                </p>
              )}
              {s.display_link ? (
                <a
                  href={s.display_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline underline-offset-2"
                >
                  {s.display_link.replace(/^https?:\/\//, "")}
                  <span aria-hidden="true">↗</span>
                </a>
              ) : null}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

function SponsorsLoading() {
  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <p className="text-sm text-muted-foreground">Načítavam zoznam…</p>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-14 animate-pulse rounded-xl border border-border/40 bg-card/40"
          aria-hidden="true"
        />
      ))}
    </div>
  );
}

function SponsorsError() {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-border/60 bg-card p-6 text-sm text-muted-foreground"
    >
      Zoznam sa momentálne nepodarilo načítať. Skús stránku obnoviť za chvíľu.
    </div>
  );
}

function SponsorsEmpty() {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-8 text-center">
      <h2 className="text-xl font-semibold text-foreground">Buď prvý</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Zatiaľ tu nikto nie je. Tvoja podpora môže projekt nakopnúť — a tvoje meno tu môže byť prvé.
      </p>
      <div className="mt-4">
        <Link
          to={ROUTES.podpora}
          className="inline-flex items-center gap-2 rounded-2xl bg-accent-gradient px-6 py-3 text-sm font-bold text-primary-foreground shadow-glow"
        >
          Podporiť projekt
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}

async function fetchLatestSponsors(): Promise<PublicSponsor[]> {
  const { data, error } = await supabase
    .from("public_sponsors")
    .select("id, display_name, display_link, display_message, created_at")
    .order("created_at", { ascending: false })
    .limit(HOMEPAGE_LIMIT);

  if (error) throw new Error(`public_sponsors fetch failed: ${error.message}`);
  return (data ?? []) as PublicSponsor[];
}

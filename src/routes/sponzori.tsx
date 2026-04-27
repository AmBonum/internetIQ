import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

const SITE_ORIGIN = "https://subenai.lvtesting.eu";
const SPONZORI_URL = `${SITE_ORIGIN}/sponzori`;

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
  return <SponzoriView fetchSponsors={fetchPublicSponsors} />;
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
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
        <header className="mb-10">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Späť na domov
          </Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Naši sponzori
          </h1>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            Vďaka týmto ľuďom funguje subenai. Detail kam idú peniaze v{" "}
            <Link to="/o-projekte" className="underline underline-offset-2 hover:text-foreground">
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
          <SponsorsGrid sponsors={state.sponsors} />
        )}

        <p className="mt-12 text-center text-xs text-muted-foreground">
          Zoznam je dobrovoľný — mnohí sponzori si zvolili anonymitu a v zozname sa nenachádzajú.
          Žiadne sumy ani počty platieb tu neukazujeme. Súhlas so zverejnením môžeš odvolať e-mailom
          na{" "}
          <a href="mailto:segnities@gmail.com" className="underline underline-offset-2">
            segnities@gmail.com
          </a>
          .
        </p>

        <Footer />
      </main>
    </div>
  );
}

function SponsorsLoading() {
  return (
    <div role="status" aria-live="polite" className="space-y-4">
      <p className="text-sm text-muted-foreground">Načítavam zoznam…</p>
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-2xl border border-border/40 bg-card/40"
            aria-hidden="true"
          />
        ))}
      </div>
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
          to="/podpora"
          className="inline-flex items-center gap-2 rounded-2xl bg-accent-gradient px-6 py-3 text-sm font-bold text-primary-foreground shadow-glow"
        >
          Podporiť projekt
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </div>
  );
}

function SponsorsGrid({ sponsors }: { sponsors: PublicSponsor[] }) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2 md:grid-cols-3" aria-label="Sponzori">
      {sponsors.map((s) => (
        <SponsorCard key={s.id} sponsor={s} />
      ))}
    </ul>
  );
}

function SponsorCard({ sponsor }: { sponsor: PublicSponsor }) {
  const dateLabel = new Date(sponsor.created_at).toLocaleDateString("sk-SK", {
    month: "long",
    year: "numeric",
  });

  return (
    <li className="flex flex-col gap-2 rounded-2xl border border-border/60 bg-card p-5">
      <div className="flex items-start justify-between gap-2">
        <h3 className="text-base font-semibold text-foreground">
          {sponsor.display_link ? (
            <a
              href={sponsor.display_link}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:underline underline-offset-2"
            >
              {sponsor.display_name}
            </a>
          ) : (
            sponsor.display_name
          )}
        </h3>
      </div>
      {sponsor.display_message ? (
        <p className="text-sm leading-relaxed text-muted-foreground">{sponsor.display_message}</p>
      ) : null}
      <p className="mt-auto text-xs text-muted-foreground">{dateLabel}</p>
    </li>
  );
}

async function fetchPublicSponsors(): Promise<PublicSponsor[]> {
  const { data, error } = await supabase
    .from("public_sponsors")
    .select("id, display_name, display_link, display_message, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(`public_sponsors fetch failed: ${error.message}`);
  return (data ?? []) as PublicSponsor[];
}

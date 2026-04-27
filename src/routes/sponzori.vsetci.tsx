import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { formatMonthYear } from "@/lib/sponsors";
import { type PublicSponsor } from "./sponzori";
import { SITE_ORIGIN, CONTACT_EMAIL } from "@/config/site";
import { ROUTES } from "@/config/routes";
const PAGE_URL = `${SITE_ORIGIN}/sponzori/vsetci`;
const FETCH_LIMIT = 500;

export const Route = createFileRoute("/sponzori/vsetci")({
  head: () => ({
    meta: [
      { title: "Všetci sponzori — subenai" },
      {
        name: "description",
        content:
          "Filtrovateľný zoznam všetkých verejných sponzorov projektu subenai. Hľadaj podľa mena alebo dátumu.",
      },
      { name: "robots", content: "index, follow" },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
  }),
  component: AllSponsorsPage,
});

function AllSponsorsPage() {
  return <AllSponsorsView fetchSponsors={fetchAllSponsors} />;
}

interface AllSponsorsViewProps {
  fetchSponsors: () => Promise<PublicSponsor[]>;
}

export function AllSponsorsView({ fetchSponsors }: AllSponsorsViewProps) {
  const [all, setAll] = useState<PublicSponsor[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nameQuery, setNameQuery] = useState("");
  const [yearFilter, setYearFilter] = useState<string>("all");

  useEffect(() => {
    let cancelled = false;
    fetchSponsors()
      .then((rows) => {
        if (!cancelled) setAll(rows);
      })
      .catch(() => {
        if (!cancelled) setError("fetch_failed");
      });
    return () => {
      cancelled = true;
    };
  }, [fetchSponsors]);

  const availableYears = useMemo(() => {
    if (!all) return [];
    const years = new Set<string>();
    for (const s of all) {
      const y = new Date(s.created_at).getFullYear();
      if (Number.isFinite(y)) years.add(String(y));
    }
    return Array.from(years).sort((a, b) => Number(b) - Number(a));
  }, [all]);

  const filtered = useMemo(() => {
    if (!all) return [];
    const q = nameQuery.trim().toLowerCase();
    return all.filter((s) => {
      if (yearFilter !== "all") {
        const y = new Date(s.created_at).getFullYear();
        if (String(y) !== yearFilter) return false;
      }
      if (q) {
        const hay = `${s.display_name} ${s.display_message ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [all, nameQuery, yearFilter]);

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:py-16">
        <header className="mb-8">
          <Link
            to={ROUTES.sponzori}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Späť na najnovších sponzorov
          </Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Všetci sponzori
          </h1>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            Kompletný verejný zoznam. Filtruj podľa mena, správy alebo roka.
          </p>
        </header>

        <section
          aria-label="Filtre"
          className="mb-6 grid gap-3 rounded-2xl border border-border/60 bg-card/40 p-4 sm:grid-cols-[1fr_auto] sm:p-5"
        >
          <div>
            <label htmlFor="filter-name" className="text-xs font-medium text-muted-foreground">
              Hľadať v mene alebo správe
            </label>
            <input
              id="filter-name"
              type="search"
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
              placeholder={`napr. Anna alebo „vďaka"`}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
            />
          </div>
          <div>
            <label htmlFor="filter-year" className="text-xs font-medium text-muted-foreground">
              Rok
            </label>
            <select
              id="filter-year"
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground sm:w-32"
            >
              <option value="all">Všetky</option>
              {availableYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </section>

        {error ? (
          <ErrorState />
        ) : !all ? (
          <LoadingState />
        ) : filtered.length === 0 ? (
          <EmptyFilterState hasAnyData={all.length > 0} />
        ) : (
          <SponsorsTable sponsors={filtered} totalCount={all.length} />
        )}

        <p className="mt-12 text-center text-xs text-muted-foreground">
          Zoznam je dobrovoľný — mnohí sponzori si zvolili anonymitu. Žiadne sumy ani počty platieb
          tu neukazujeme. Súhlas so zverejnením môžeš odvolať e-mailom na{" "}
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

function SponsorsTable({
  sponsors,
  totalCount,
}: {
  sponsors: PublicSponsor[];
  totalCount: number;
}) {
  return (
    <section className="space-y-4">
      <p className="text-xs text-muted-foreground" role="status" aria-live="polite">
        Zobrazených {sponsors.length}{" "}
        {sponsors.length === totalCount ? `(všetkých ${totalCount})` : `z ${totalCount}`}
      </p>
      <ul className="grid gap-3 sm:grid-cols-2">
        {sponsors.map((s) => (
          <li key={s.id} className="space-y-2 rounded-2xl border border-border/60 bg-card p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-base font-semibold text-foreground">
                {s.display_link ? (
                  <a
                    href={s.display_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline underline-offset-2"
                  >
                    {s.display_name}
                  </a>
                ) : (
                  s.display_name
                )}
              </h2>
              <time dateTime={s.created_at} className="text-xs text-muted-foreground">
                {formatMonthYear(s.created_at)}
              </time>
            </div>
            {s.display_message ? (
              <p className="text-sm leading-relaxed text-muted-foreground">„{s.display_message}"</p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

function LoadingState() {
  return (
    <div role="status" aria-live="polite" className="space-y-3">
      <p className="text-sm text-muted-foreground">Načítavam zoznam…</p>
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-24 animate-pulse rounded-2xl border border-border/40 bg-card/40"
            aria-hidden="true"
          />
        ))}
      </div>
    </div>
  );
}

function ErrorState() {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-border/60 bg-card p-6 text-sm text-muted-foreground"
    >
      Zoznam sa momentálne nepodarilo načítať. Skús stránku obnoviť za chvíľu.
    </div>
  );
}

function EmptyFilterState({ hasAnyData }: { hasAnyData: boolean }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-8 text-center">
      <p className="text-sm leading-relaxed text-muted-foreground">
        {hasAnyData
          ? "Nič nezodpovedá filtru. Skús iné meno alebo rok."
          : "Zatiaľ tu nikto nie je. Buď prvý — podpor projekt na /podpora."}
      </p>
    </div>
  );
}

async function fetchAllSponsors(): Promise<PublicSponsor[]> {
  const { data, error } = await supabase
    .from("public_sponsors")
    .select("id, display_name, display_link, display_message, created_at")
    .order("created_at", { ascending: false })
    .limit(FETCH_LIMIT);

  if (error) throw new Error(`public_sponsors fetch failed: ${error.message}`);
  return (data ?? []) as PublicSponsor[];
}

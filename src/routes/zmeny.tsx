import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";
import changelog from "@/content/changelog.generated.json";
import { SITE_ORIGIN } from "@/config/site";
const PAGE_URL = `${SITE_ORIGIN}/zmeny`;

interface ChangelogEntry {
  version: string;
  date: string;
  added: string[];
  changed: string[];
  fixed: string[];
  removed: string[];
  deprecated: string[];
  security: string[];
}

const entries = changelog as ChangelogEntry[];

const SECTION_LABELS: Record<keyof Omit<ChangelogEntry, "version" | "date">, string> = {
  added: "Pridané",
  changed: "Zmenené",
  fixed: "Opravené",
  removed: "Odstránené",
  deprecated: "Zastarané",
  security: "Bezpečnosť",
};

const SECTION_TONE: Record<keyof typeof SECTION_LABELS, string> = {
  added: "border-success/40 bg-success/10 text-success-foreground",
  changed: "border-primary/40 bg-primary/10 text-foreground",
  fixed: "border-warning/40 bg-warning/10 text-warning-foreground",
  removed: "border-destructive/40 bg-destructive/10 text-foreground",
  deprecated: "border-muted bg-muted text-muted-foreground",
  security: "border-destructive/60 bg-destructive/15 text-foreground",
};

const articleJsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  url: PAGE_URL,
  name: "Zmeny a verzie — subenai",
  itemListOrder: "https://schema.org/ItemListOrderDescending",
  itemListElement: entries.slice(0, 10).map((e, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "Article",
      headline: `subenai ${e.version}`,
      datePublished: e.date,
      url: `${PAGE_URL}#v${e.version}`,
    },
  })),
};

export const Route = createFileRoute("/zmeny")({
  head: () => ({
    meta: [
      { title: "Zmeny a verzie — subenai" },
      {
        name: "description",
        content:
          "Verejný changelog projektu subenai — čo sa pridalo, zmenilo a opravilo v každej verzii. Aktualizovaný pri každom deploy.",
      },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "Zmeny a verzie — subenai" },
      { property: "og:url", content: PAGE_URL },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(articleJsonLd),
      },
    ],
  }),
  component: ZmenyPage,
});

function ZmenyPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
        <header className="mb-10">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Späť na domov
          </Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Zmeny a verzie
          </h1>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            Verejný zoznam toho, čo sa v projekte za posledné obdobie zmenilo.
            {entries[0] ? (
              <>
                {" "}
                Posledný deploy:{" "}
                <time dateTime={entries[0].date}>{formatDate(entries[0].date)}</time> (verzia{" "}
                {entries[0].version}).
              </>
            ) : null}
          </p>
        </header>

        {entries.length === 0 ? (
          <p className="rounded-2xl border border-border/60 bg-card p-6 text-sm text-muted-foreground">
            Zatiaľ žiadne verzie.
          </p>
        ) : (
          <ol className="space-y-8" aria-label="Zoznam verzií">
            {entries.map((entry) => (
              <VersionBlock key={entry.version} entry={entry} />
            ))}
          </ol>
        )}

        <Footer />
      </main>
    </div>
  );
}

function VersionBlock({ entry }: { entry: ChangelogEntry }) {
  const sections = (Object.keys(SECTION_LABELS) as Array<keyof typeof SECTION_LABELS>).filter(
    (key) => entry[key].length > 0,
  );
  const anchor = `v${entry.version}`;

  return (
    <li
      id={anchor}
      className="space-y-4 rounded-2xl border border-border/60 bg-card p-6 sm:p-8 scroll-mt-24"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h2 className="text-xl font-bold text-foreground">
          <a href={`#${anchor}`} className="hover:underline underline-offset-2">
            subenai {entry.version}
          </a>
        </h2>
        <time dateTime={entry.date} className="text-sm text-muted-foreground">
          {formatDate(entry.date)}
        </time>
      </div>

      {sections.length === 0 ? (
        <p className="text-sm text-muted-foreground">(prázdna verzia — len interné zmeny)</p>
      ) : (
        sections.map((key) => (
          <section key={key} className="space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <span
                className={`inline-flex rounded-md border px-2 py-0.5 text-xs font-bold uppercase tracking-wide ${SECTION_TONE[key]}`}
              >
                {SECTION_LABELS[key]}
              </span>
            </h3>
            <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
              {entry[key].map((item, i) => (
                <li key={i} dangerouslySetInnerHTML={{ __html: renderInline(item) }} />
              ))}
            </ul>
          </section>
        ))
      )}
    </li>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("sk-SK", { day: "numeric", month: "long", year: "numeric" });
}

const ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch] ?? ch);
}

function renderInline(value: string): string {
  // Allow a tiny safe subset of inline markdown: **bold**, *italic*, and
  // `code`. Everything is HTML-escaped first so a malformed/misescaped
  // changelog entry can never inject markup.
  return escapeHtml(value)
    .replace(
      /`([^`]+)`/g,
      (_, code) => `<code class="rounded bg-muted px-1 py-0.5 text-xs">${code}</code>`,
    )
    .replace(/\*\*([^*]+)\*\*/g, (_, bold) => `<strong class="text-foreground">${bold}</strong>`)
    .replace(/\*([^*]+)\*/g, (_, em) => `<em>${em}</em>`);
}

import { Link } from "@tanstack/react-router";
import { useConsent } from "@/hooks/useConsent";
import changelog from "@/content/changelog.generated.json";

const CURRENT_VERSION = (changelog as { version: string }[])[0]?.version ?? "—";

interface FooterLink {
  to: string;
  label: string;
}

const COLUMNS: { title: string; links: FooterLink[] }[] = [
  {
    title: "Obsah",
    links: [
      { to: "/test", label: "Spustiť test" },
      { to: "/test/firma", label: "Testy pre firmy" },
      { to: "/skolenia", label: "Školenia" },
    ],
  },
  {
    title: "Projekt",
    links: [
      { to: "/o-projekte", label: "O projekte" },
      { to: "/podpora", label: "Podporiť projekt" },
      { to: "/sponzori", label: "Sponzori" },
      { to: "/zmeny", label: "Zmeny a verzie" },
    ],
  },
  {
    title: "Právne",
    links: [
      { to: "/privacy", label: "Súkromie" },
      { to: "/cookies", label: "Cookies" },
      { to: "/spravovat-podporu", label: "Spravovať podporu" },
    ],
  },
];

export function Footer() {
  const { openPreferences } = useConsent();

  return (
    <footer className="mt-24 border-t border-border/60 pt-12 pb-8">
      <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-4">
        <div className="space-y-3">
          <Link to="/" className="inline-flex items-center" aria-label="subenai — domov">
            <img src="/logo.svg" alt="subenai" className="h-8 w-auto" />
          </Link>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Bezplatný edukatívny nástroj pre slovenský digitálny svet.
          </p>
          <p className="text-xs text-muted-foreground">
            spravené s 🍺 v Košiciach ·{" "}
            <Link
              to="/zmeny"
              className="font-mono hover:text-foreground transition-colors"
              aria-label={`Aktuálna verzia v${CURRENT_VERSION} — zoznam zmien`}
            >
              v{CURRENT_VERSION}
            </Link>
          </p>
        </div>

        {COLUMNS.map((col) => (
          <FooterColumn key={col.title} title={col.title} links={col.links} />
        ))}
      </div>

      <div className="mt-10 flex flex-col items-start justify-between gap-3 border-t border-border/40 pt-6 sm:flex-row sm:items-center">
        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} am.bonum s. r. o. · IČO 55 055 290
        </p>
        <button
          type="button"
          onClick={openPreferences}
          className="text-xs text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline"
        >
          Nastavenia cookies
        </button>
      </div>
    </footer>
  );
}

function FooterColumn({ title, links }: { title: string; links: FooterLink[] }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">{title}</h3>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.to}>
            <Link
              to={link.to}
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

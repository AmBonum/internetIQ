import { Link, useLocation } from "@tanstack/react-router";

const NAV_ITEMS = [
  { to: "/test/firma", label: "Testy" },
  { to: "/skolenia", label: "Školenia" },
  { to: "/podpora", label: "Podporiť" },
] as const;

const CTA_ITEM = { to: "/test", label: "Spustiť rýchly test" } as const;

export function SiteHeader() {
  const { pathname } = useLocation();

  // The most-specific matching item wins — keeps nested routes
  // (e.g. /test/firma/eshop) highlighting only the deepest registered
  // nav entry instead of every prefix.
  const activeTo = NAV_ITEMS.reduce<string | null>((acc, item) => {
    const matches = pathname === item.to || pathname.startsWith(item.to + "/");
    if (!matches) return acc;
    if (!acc || item.to.length > acc.length) return item.to;
    return acc;
  }, null);

  const navItem = (to: string, label: string) => (
    <Link
      to={to}
      className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:text-foreground ${
        activeTo === to ? "text-foreground" : "text-muted-foreground"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav
        aria-label="Hlavná navigácia"
        className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3"
      >
        <Link to="/" className="flex items-center" aria-label="subenai — domov">
          <img src="/favicon.svg" alt="" aria-hidden="true" className="h-7 w-7 sm:hidden" />
          <img src="/logo.svg" alt="subenai" className="hidden sm:block h-7 w-auto" />
        </Link>
        <div className="flex items-center gap-1 sm:gap-2">
          {navItem("/test/firma", "Testy")}
          {navItem("/skolenia", "Školenia")}
          <Link
            to="/podpora"
            className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:text-foreground ${
              activeTo === "/podpora" ? "text-foreground" : "text-muted-foreground"
            }`}
          >
            <span className="sm:hidden">Podporiť</span>
            <span className="hidden sm:inline">Podporiť projekt</span>
          </Link>
          <Link
            to={CTA_ITEM.to}
            aria-label={CTA_ITEM.label}
            className="ml-1 inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-2xl bg-accent-gradient px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-glow transition-transform hover:scale-[1.03] active:scale-[0.99] sm:px-4 sm:py-2 sm:text-sm"
          >
            Spustiť <span className="hidden sm:inline">rýchly </span>test
            <span aria-hidden="true">→</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}

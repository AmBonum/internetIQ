import { Link, useLocation } from "@tanstack/react-router";

export function SiteHeader() {
  const { pathname } = useLocation();

  const navItem = (to: string, label: string) => {
    const active = pathname === to || (to !== "/" && pathname.startsWith(to));
    return (
      <Link
        to={to}
        className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors hover:text-foreground ${
          active ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        {label}
      </Link>
    );
  };

  return (
    <header className="sticky top-0 z-40 border-b border-border/40 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav
        aria-label="Hlavná navigácia"
        className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3"
      >
        <Link
          to="/"
          className="flex items-center gap-2 text-sm font-bold tracking-tight text-foreground"
          aria-label="Internet IQ Test — domov"
        >
          <span className="grid h-7 w-7 place-items-center rounded-md bg-primary text-primary-foreground">
            iQ
          </span>
          <span className="hidden sm:inline">Internet IQ Test</span>
        </Link>
        <div className="flex items-center gap-1">
          {navItem("/test", "Test")}
          {navItem("/kurzy", "Kurzy")}
        </div>
      </nav>
    </header>
  );
}

import { Link } from "@tanstack/react-router";
import { useConsent } from "@/hooks/useConsent";

export function Footer() {
  const { openPreferences } = useConsent();

  return (
    <footer className="mt-24 border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
      <p>
        Internet IQ Test · spravené s 🍺 v Košiciach ·{" "}
        <Link to="/" className="hover:text-foreground transition-colors">
          O nás
        </Link>
      </p>
      <p className="mt-2 space-x-3">
        <Link to="/skolenia" className="hover:text-foreground transition-colors">
          Školenia
        </Link>
        <span aria-hidden="true">·</span>
        <Link to="/privacy" className="hover:text-foreground transition-colors">
          Súkromie
        </Link>
        <span aria-hidden="true">·</span>
        <Link to="/cookies" className="hover:text-foreground transition-colors">
          Cookies
        </Link>
        <span aria-hidden="true">·</span>
        <button
          type="button"
          onClick={openPreferences}
          className="cursor-pointer underline-offset-2 hover:text-foreground hover:underline transition-colors"
        >
          Nastavenia cookies
        </button>
      </p>
    </footer>
  );
}

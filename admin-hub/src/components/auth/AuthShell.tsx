import { Link } from "@tanstack/react-router";
import { ShieldCheck, Sparkles } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  title: string;
  subtitle: string;
  children: ReactNode;
  variant?: "user" | "admin";
  footer?: ReactNode;
}

const highlights = {
  user: [
    "Vlastné sady testov pre rodinu, kolegov a klientov",
    "Zdieľanie cez link alebo email pozvánky",
    "Štatistiky a leaderboard pre tvoj okruh",
  ],
  admin: [
    "Plná správa otázok, sád odpovedí a testov",
    "AI generovanie obsahu cez Lovable AI Gateway",
    "Reporty, audit a kontrola používateľov",
  ],
};

export function AuthShell({ title, subtitle, children, variant = "user", footer }: Props) {
  const isAdmin = variant === "admin";
  const Icon = isAdmin ? ShieldCheck : Sparkles;
  const bullets = highlights[variant];

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-[image:var(--gradient-primary)] text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-white/20 blur-3xl"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-black/30 blur-3xl"
          aria-hidden
        />

        <div className="relative">
          <Link to="/" className="flex items-center gap-2 text-lg font-semibold tracking-tight">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
              <Icon className="h-5 w-5" />
            </span>
            SubenAI {isAdmin && <span className="text-primary-foreground/70">· Admin</span>}
          </Link>
        </div>

        <div className="relative space-y-6">
          <h1 className="text-4xl font-semibold tracking-tight">
            {isAdmin
              ? "Vitaj späť v administrácii."
              : "Otestuj seba aj svojich blízkych."}
          </h1>
          <p className="max-w-md text-primary-foreground/80">
            {isAdmin
              ? "Spravuj celú platformu subenai.sk — od otázok cez testy až po share karty."
              : "SubenAI ti pomáha rozoznať najčastejšie podvody na slovenskom internete. Vytvor si vlastnú sadu a pošli ju komukoľvek."}
          </p>
          <ul className="space-y-3 text-sm text-primary-foreground/90">
            {bullets.map((b) => (
              <li key={b} className="flex items-start gap-3">
                <span className="mt-1.5 inline-block h-1.5 w-1.5 rounded-full bg-primary-foreground/80" />
                {b}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative text-xs text-primary-foreground/60">
          © {new Date().getFullYear()} SubenAI · ochrana pred podvodmi na slovenskom internete
        </div>
      </div>

      {/* Form panel */}
      <div className="flex min-h-screen flex-col bg-[image:var(--gradient-subtle)]">
        <div className="flex items-center justify-between border-b border-border/40 px-6 py-4 lg:hidden">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-foreground">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-[image:var(--gradient-primary)] text-primary-foreground">
              <Icon className="h-4 w-4" />
            </span>
            SubenAI {isAdmin && <span className="text-muted-foreground">· Admin</span>}
          </Link>
        </div>

        <div className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
          <div className="w-full max-w-md space-y-6">
            <div className="space-y-1.5">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h2>
              <p className="text-sm text-muted-foreground">{subtitle}</p>
            </div>

            {children}

            {footer && <div className="pt-2 text-sm text-muted-foreground">{footer}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

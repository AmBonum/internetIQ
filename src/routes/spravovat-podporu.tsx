import { useState, type FormEvent } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";

const SITE_ORIGIN = "https://subenai.lvtesting.eu";
const PAGE_URL = `${SITE_ORIGIN}/spravovat-podporu`;

export const Route = createFileRoute("/spravovat-podporu")({
  head: () => ({
    meta: [
      { title: "Spravovať podporu — subenai" },
      {
        name: "description",
        content:
          "Pošli si na e-mail odkaz na Stripe Customer Portal — zruš mesačný odber, zmeň kartu, stiahni faktúry.",
      },
      { name: "robots", content: "index, follow" },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
  }),
  component: SpravovatPodporuPage,
});

function SpravovatPodporuPage() {
  return <ManageSupportForm />;
}

export function ManageSupportForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!emailValid || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/portal-magic-link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!response.ok && response.status !== 200) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        setError(payload.error ?? "send_failed");
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
      setSubmitting(false);
    } catch {
      setError("network_error");
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:py-16">
        <header className="mb-8">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Späť na domov
          </Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Spravovať podporu
          </h1>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            Zadaj e-mail, ktorým si pri{" "}
            <Link to="/podpora" className="underline underline-offset-2 hover:text-foreground">
              podpore
            </Link>{" "}
            prispel/a. Pošleme ti naň odkaz na Stripe Customer Portal — môžeš tam{" "}
            <strong>zrušiť mesačný odber jediným klikom</strong>, zmeniť kartu alebo stiahnuť
            faktúry.
          </p>
        </header>

        {submitted ? (
          <SubmittedState email={email} />
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-5 rounded-2xl border border-border/60 bg-card p-6 sm:p-8"
            aria-labelledby="manage-h1"
          >
            <h2 id="manage-h1" className="sr-only">
              Formulár na zaslanie odkazu
            </h2>
            <div>
              <label htmlFor="email" className="text-sm font-medium text-foreground">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
                className="mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Bezpečnostná poznámka: bez ohľadu na to, či pre tento e-mail nájdeme platbu,
                dostaneš rovnakú odpoveď. Tým sa nedá zistiť kto je sponzorom (anti-enumeration).
              </p>
            </div>

            {error ? (
              <div
                role="alert"
                className="rounded-xl border border-destructive/60 bg-destructive/10 p-3 text-sm text-foreground"
              >
                Niečo sa pokazilo: <code>{error}</code>. Skús to prosím znova alebo nám napíš na{" "}
                <a href="mailto:segnities@gmail.com" className="underline underline-offset-2">
                  segnities@gmail.com
                </a>
                .
              </div>
            ) : null}

            <button
              type="submit"
              disabled={!emailValid || submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent-gradient px-6 py-3 text-base font-bold text-primary-foreground shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Posielam…" : "Poslať odkaz na e-mail"}
              <span aria-hidden="true">→</span>
            </button>
          </form>
        )}

        <Footer />
      </main>
    </div>
  );
}

function SubmittedState({ email }: { email: string }) {
  return (
    <section
      role="status"
      aria-live="polite"
      className="space-y-4 rounded-2xl border border-primary/40 bg-card p-8 text-center"
    >
      <h2 className="text-2xl font-bold tracking-tight text-foreground">Skontroluj e-mail</h2>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Ak na <strong>{email}</strong> evidujeme podporu, do pár minút ti príde e-mail s odkazom na
        Stripe Customer Portal. Odkaz platí <strong>1 hodinu</strong>.
      </p>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Nedošiel ti e-mail? Skontroluj spam priečinok. Ak neprišiel ani po 5 minútach, daj nám
        vedieť na{" "}
        <a href="mailto:segnities@gmail.com" className="underline underline-offset-2">
          segnities@gmail.com
        </a>
        .
      </p>
    </section>
  );
}

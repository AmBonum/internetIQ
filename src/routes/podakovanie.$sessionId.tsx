import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_MS = 30000;

type Status = "loading" | "ready" | "pending" | "unpaid" | "not_found" | "timeout" | "error";

interface DonationDto {
  amount_eur: number;
  currency: string;
  kind: "oneoff" | "subscription_invoice";
  created_at: string;
  invoice_pdf_url: string | null;
}

interface DonationStatusResponse {
  status: "ready" | "pending" | "unpaid" | "not_found";
  is_subscription?: boolean;
  donation?: DonationDto;
  sponsor_display_name?: string | null;
  has_customer?: boolean;
}

export const Route = createFileRoute("/podakovanie/$sessionId")({
  head: () => ({
    meta: [
      { title: "Ďakujeme za podporu — subenai" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: PodakovaniePage,
});

function PodakovaniePage() {
  const { sessionId } = useParams({ from: "/podakovanie/$sessionId" });
  return <ThankYouView sessionId={sessionId} />;
}

interface ThankYouViewProps {
  sessionId: string;
}

export function ThankYouView({ sessionId }: ThankYouViewProps) {
  const [status, setStatus] = useState<Status>("loading");
  const [data, setData] = useState<DonationStatusResponse | null>(null);
  const [portalSubmitting, setPortalSubmitting] = useState(false);
  const [portalError, setPortalError] = useState<string | null>(null);
  const startedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    async function poll() {
      try {
        const response = await fetch(
          `/api/donation-status?session_id=${encodeURIComponent(sessionId)}`,
          { headers: { accept: "application/json" } },
        );
        if (cancelled) return;

        if (response.status === 404) {
          setStatus("not_found");
          return;
        }
        if (!response.ok) {
          setStatus("error");
          return;
        }

        const payload = (await response.json()) as DonationStatusResponse;
        if (cancelled) return;
        setData(payload);

        if (payload.status === "ready") {
          setStatus("ready");
          return;
        }
        if (payload.status === "not_found") {
          setStatus("not_found");
          return;
        }
        if (payload.status === "unpaid") {
          setStatus("unpaid");
          return;
        }

        const elapsed = Date.now() - startedAtRef.current;
        if (elapsed >= POLL_MAX_MS) {
          setStatus("timeout");
          return;
        }
        setStatus("pending");
        timer = setTimeout(poll, POLL_INTERVAL_MS);
      } catch {
        if (cancelled) return;
        setStatus("error");
      }
    }

    void poll();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [sessionId]);

  async function openCustomerPortal() {
    setPortalSubmitting(true);
    setPortalError(null);
    try {
      const response = await fetch("/api/customer-portal", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ session_id: sessionId }),
      });
      const payload = (await response.json()) as { url?: string; error?: string };
      if (!response.ok || !payload.url) {
        setPortalError(payload.error ?? "portal_failed");
        setPortalSubmitting(false);
        return;
      }
      window.location.href = payload.url;
    } catch {
      setPortalError("network_error");
      setPortalSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:py-16">
        <header className="mb-8">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            ← Späť na domov
          </Link>
        </header>

        {status === "loading" || status === "pending" ? (
          <PendingState />
        ) : status === "ready" && data?.donation ? (
          <ReadyState
            donation={data.donation}
            sponsorDisplayName={data.sponsor_display_name ?? null}
            isSubscription={data.is_subscription === true}
            portalSubmitting={portalSubmitting}
            portalError={portalError}
            onOpenPortal={openCustomerPortal}
          />
        ) : status === "unpaid" ? (
          <UnpaidState />
        ) : status === "timeout" ? (
          <TimeoutState />
        ) : status === "not_found" ? (
          <NotFoundState />
        ) : (
          <ErrorState />
        )}

        <Footer />
      </main>
    </div>
  );
}

function PendingState() {
  return (
    <section
      role="status"
      aria-live="polite"
      className="space-y-4 rounded-2xl border border-border/60 bg-card p-8 text-center"
    >
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Hľadáme tvoju platbu…</h1>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Stripe webhook môže trvať pár sekúnd. Stránka sa sama obnoví, nemusíš nič robiť.
      </p>
      <div className="mx-auto h-2 w-32 overflow-hidden rounded-full bg-muted" aria-hidden="true">
        <div className="h-full w-1/3 animate-pulse bg-primary" />
      </div>
    </section>
  );
}

interface ReadyStateProps {
  donation: DonationDto;
  sponsorDisplayName: string | null;
  isSubscription: boolean;
  portalSubmitting: boolean;
  portalError: string | null;
  onOpenPortal: () => void;
}

function ReadyState({
  donation,
  sponsorDisplayName,
  isSubscription,
  portalSubmitting,
  portalError,
  onOpenPortal,
}: ReadyStateProps) {
  const greeting = sponsorDisplayName ? `Ďakujeme, ${sponsorDisplayName}!` : "Ďakujeme za podporu!";
  const dateLabel = new Date(donation.created_at).toLocaleDateString("sk-SK", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const kindLabel = isSubscription ? "Mesačný odber" : "Jednorazová podpora";
  const amountLabel = `${donation.amount_eur.toFixed(2)} ${donation.currency.toUpperCase()}${
    isSubscription ? "/mes" : ""
  }`;

  return (
    <section className="space-y-6">
      <div className="space-y-3 rounded-2xl border border-primary/40 bg-card p-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          {greeting}
        </h1>
        <p className="text-base text-muted-foreground sm:text-lg">
          {kindLabel}: <strong className="text-foreground">{amountLabel}</strong>
        </p>
        <p className="text-sm text-muted-foreground">{dateLabel}</p>
      </div>

      <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-6">
        <h2 className="text-lg font-semibold text-foreground">Faktúra a doklady</h2>
        {donation.invoice_pdf_url ? (
          <a
            href={donation.invoice_pdf_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground hover:border-primary/40"
          >
            Stiahnuť faktúru (PDF)
            <span aria-hidden="true">↗</span>
          </a>
        ) : (
          <p className="text-sm leading-relaxed text-muted-foreground">
            Faktúru ti Stripe pošle e-mailom v priebehu pár minút. PDF link sa objaví aj tu po
            obnovení stránky.
          </p>
        )}
        <p className="text-xs leading-relaxed text-muted-foreground">
          Faktúru vystavila <strong>am.bonum s. r. o.</strong>, IČO 55 055 290, sídlo Škultétyho
          1560/3, 052 01 Spišská Nová Ves. Nie sme platcami DPH (§ 4 zákona č. 222/2004 Z. z.).
        </p>
      </div>

      {isSubscription ? (
        <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-6">
          <h2 className="text-lg font-semibold text-foreground">Spravovať mesačný odber</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Odber môžeš <strong>kedykoľvek zrušiť jediným klikom</strong> alebo zmeniť kartu cez
            Stripe Customer Portal. Žiadny „are you sure" loop, žiadne pause-tactics.
          </p>
          <button
            type="button"
            onClick={onOpenPortal}
            disabled={portalSubmitting}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2 text-sm font-semibold text-foreground hover:border-primary/40 disabled:opacity-50"
          >
            {portalSubmitting ? "Otváram portál…" : "Spravovať odber"}
            <span aria-hidden="true">→</span>
          </button>
          {portalError ? (
            <p role="alert" className="text-sm text-foreground">
              Portál sa nepodarilo otvoriť: <code>{portalError}</code>. Napíš nám na{" "}
              <a href="mailto:subenai.podpora@gmail.com" className="underline underline-offset-2">
                subenai.podpora@gmail.com
              </a>
              .
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-2 rounded-2xl border border-border/60 bg-card p-6 text-sm leading-relaxed text-muted-foreground">
        <p>
          Tvoje peniaze idú na hosting (Cloudflare ~5 €/mes), Supabase databázu (~25 €/mes), Stripe
          poplatky (~3 %) a tvorbu nového obsahu. Detailný breakdown v{" "}
          <Link to="/o-projekte" className="underline underline-offset-2 hover:text-foreground">
            O projekte
          </Link>
          .
        </p>
      </div>
    </section>
  );
}

function UnpaidState() {
  return (
    <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-8 text-center">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Platba ešte neprešla</h1>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Vyzerá to, že platba nebola dokončená. Skús to prosím znova alebo nás kontaktuj na{" "}
        <a href="mailto:subenai.podpora@gmail.com" className="underline underline-offset-2">
          subenai.podpora@gmail.com
        </a>
        .
      </p>
      <Link
        to="/podpora"
        className="inline-flex items-center gap-2 rounded-2xl bg-accent-gradient px-6 py-3 text-sm font-bold text-primary-foreground"
      >
        Späť na /podpora
      </Link>
    </section>
  );
}

function TimeoutState() {
  return (
    <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-8 text-center">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Stále spracúvame…</h1>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Stripe nám ešte neposlal potvrdenie. Tvoja platba je pravdepodobne v poriadku — Stripe ti
        pošle faktúru e-mailom hneď ako ju spracuje. Ak to bude trvať dlhšie ako 10 minút, napíš nám
        na{" "}
        <a href="mailto:subenai.podpora@gmail.com" className="underline underline-offset-2">
          subenai.podpora@gmail.com
        </a>{" "}
        s ID platby z e-mailu od Stripe.
      </p>
    </section>
  );
}

function NotFoundState() {
  return (
    <section className="space-y-4 rounded-2xl border border-border/60 bg-card p-8 text-center">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Neznáma platba</h1>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Tento odkaz nezodpovedá žiadnej platbe v našom systéme. Skontroluj URL alebo nás kontaktuj
        na{" "}
        <a href="mailto:subenai.podpora@gmail.com" className="underline underline-offset-2">
          subenai.podpora@gmail.com
        </a>
        .
      </p>
    </section>
  );
}

function ErrorState() {
  return (
    <section className="space-y-4 rounded-2xl border border-destructive/60 bg-card p-8 text-center">
      <h1 className="text-2xl font-bold tracking-tight text-foreground">Niečo sa pokazilo</h1>
      <p className="text-sm leading-relaxed text-muted-foreground">
        Stránku obnov za chvíľu — ak sa chyba opakuje, daj nám vedieť na{" "}
        <a href="mailto:subenai.podpora@gmail.com" className="underline underline-offset-2">
          subenai.podpora@gmail.com
        </a>
        .
      </p>
    </section>
  );
}

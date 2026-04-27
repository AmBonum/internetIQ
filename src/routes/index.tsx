import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "subenai — Zistíš, či by si prežil" },
      {
        name: "description",
        content:
          "10 otázok. 90 sekúnd. Reálne scam správy, emaily a stránky. Zisti, či by si na internete prežil — alebo ťa scammeri rozoberú na súčiastky.",
      },
      { property: "og:title", content: "subenai" },
      {
        property: "og:description",
        content: "Be online, but safe.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { count: c } = await supabase
        .from("attempts")
        .select("id", { count: "exact", head: true });
      if (!cancelled && typeof c === "number") setCount(c);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Display: real count + a small offset so first visitors don't see "0 ľudí"
  const displayCount = count === null ? null : count + 127;

  return (
    <div className="min-h-screen bg-hero">
      <main className="mx-auto max-w-3xl px-4 pt-16 pb-12 sm:pt-24">
        {/* Hero */}
        <div className="text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur">
            <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
            {displayCount === null
              ? "Načítavam štatistiky…"
              : `Už otestovaných ${displayCount.toLocaleString("sk-SK")} ľudí`}
          </div>

          <h1 className="text-balance text-5xl font-black leading-[1.05] tracking-tight sm:text-7xl">
            subenai
            <br />
            <span className="text-foreground">Zistíš, či by si prežil.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-xl text-balance text-base text-muted-foreground sm:text-lg">
            10 otázok. 90 sekúnd. Reálne scam správy, emaily a stránky. Uvidíš, kde máš slabinu — a
            či by si z nej žil.
          </p>

          <div className="mt-10 flex flex-col items-center gap-3">
            <Link
              to="/test"
              className="group inline-flex items-center gap-2 rounded-2xl bg-accent-gradient px-8 py-5 text-lg font-bold text-primary-foreground shadow-glow transition-transform hover:scale-[1.03] active:scale-[0.99]"
            >
              Spustiť test
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <span className="text-xs text-muted-foreground">
              Bez registrácie · 90 sekúnd · Zadarmo
            </span>
          </div>
        </div>

        {/* How it works */}
        <section className="mt-24">
          <h2 className="text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Žiadna registrácia. Žiadne bullshit.
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {[
              {
                n: "10",
                title: "otázok",
                sub: "phishing, scam, fake stránky",
              },
              {
                n: "90s",
                title: "limit",
                sub: "čas beží, žiadne googlenie",
              },
              {
                n: "1",
                title: "profil",
                sub: "zistíš, aký user si",
              },
            ].map((c) => (
              <div
                key={c.title}
                className="rounded-2xl border border-border/60 bg-card/70 p-5 shadow-card backdrop-blur"
              >
                <div className="font-display text-4xl font-black text-primary">{c.n}</div>
                <div className="mt-1 text-base font-semibold">{c.title}</div>
                <div className="mt-1 text-sm text-muted-foreground">{c.sub}</div>
              </div>
            ))}
          </div>
        </section>

        {/* What else is here */}
        <section className="mt-20 grid gap-4 sm:grid-cols-2">
          <Link
            to="/test/firma"
            className="group rounded-2xl border border-border/60 bg-card/70 p-6 shadow-card backdrop-blur transition hover:border-primary/50 hover:bg-card"
          >
            <div className="text-3xl">🏢</div>
            <h2 className="mt-3 text-lg font-bold group-hover:text-primary">Testy pre firmy</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Predefinované testy podľa branže — e-shop, gastro, IT, autoservis. Otestuj celý tím
              naraz. 5–15 minút.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
              Pozrieť testy{" "}
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </span>
          </Link>

          <Link
            to="/skolenia"
            className="group rounded-2xl border border-border/60 bg-card/70 p-6 shadow-card backdrop-blur transition hover:border-primary/50 hover:bg-card"
          >
            <div className="text-3xl">📚</div>
            <h2 className="mt-3 text-lg font-bold group-hover:text-primary">Bezplatné školenia</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Phishing, smishing, romance scams, BEC podvody. Krátke kurzy s reálnymi príkladmi zo
              slovenského prostredia.
            </p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-primary">
              Pozrieť školenia{" "}
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </span>
          </Link>
        </section>

        {/* FAQ */}
        <section className="mt-20">
          <h2 className="text-2xl font-bold">Časté otázky</h2>
          <dl className="mt-6 space-y-5 text-sm">
            <div>
              <dt className="font-semibold">Je to seriózne použiteľné?</dt>
              <dd className="mt-1 text-muted-foreground">
                Otázky stavané podľa reálnych scam vzorcov. Nie je to audit, ale pošli to rodičom —
                a uvidíš.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Je to zadarmo?</dt>
              <dd className="mt-1 text-muted-foreground">
                Áno. Test aj všetky školenia sú bezplatné. Bez reklám. Bez registrácie.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Čo sú testy pre firmy?</dt>
              <dd className="mt-1 text-muted-foreground">
                Predpripravené sady otázok prispôsobené konkrétnej branži. E-shop dostane otázky o
                falošných objednávkach, gastro o falošných kontrolách. Stačí zdieľať link s tímom.
              </dd>
            </div>
            <div>
              <dt className="font-semibold">Dá sa to podvádzať?</dt>
              <dd className="mt-1 text-muted-foreground">Skús. Uvidíme, kto z nás je chytrejší.</dd>
            </div>
          </dl>
        </section>

        <Footer />
      </main>
    </div>
  );
}

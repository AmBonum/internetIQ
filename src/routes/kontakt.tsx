import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";
import { CONTACT_EMAIL, SITE_ORIGIN } from "@/config/site";
import { ROUTES } from "@/config/routes";

const KONTAKT_URL = `${SITE_ORIGIN}${ROUTES.kontakt}`;

interface Topic {
  label: string;
  subject: string;
  hint: string;
}

const TOPICS: Topic[] = [
  {
    label: "Technická pomoc / chyba na stránke",
    subject: "Technická pomoc",
    hint: "Niečo nefunguje, stránka padá, alebo ti chýba feature.",
  },
  {
    label: "Otázka k testu, kurzu alebo obsahu",
    subject: "Obsahová otázka",
    hint: "Nejasná otázka v teste, doplnenie do kurzu, návrh nového obsahu.",
  },
  {
    label: "Sponzorstvo a faktúry",
    subject: "Sponzorstvo a faktúry",
    hint: "Otázky k podpore projektu, zmena údajov, refund, faktúra.",
  },
  {
    label: "GDPR žiadosť (vymazanie, prístup, námietka)",
    subject: "GDPR žiadosť",
    hint: "Žiadosť o vymazanie zdieľaného výsledku, prístup k údajom, námietka.",
  },
  {
    label: "Spolupráca alebo médiá",
    subject: "Spolupráca",
    hint: "Partnerstvo, novinárska otázka, prezentácia projektu.",
  },
  {
    label: "Iné",
    subject: "Otázka",
    hint: "Čokoľvek, čo sa nezmestilo do kategórií vyššie.",
  },
];

function buildMailto(subject: string): string {
  const params = new URLSearchParams({ subject: `subenai — ${subject}` });
  return `mailto:${CONTACT_EMAIL}?${params.toString()}`;
}

export const Route = createFileRoute("/kontakt")({
  head: () => ({
    meta: [
      { title: "Kontakt — subenai" },
      {
        name: "description",
        content:
          "Napíš nám priamo na email. Technická pomoc, GDPR žiadosti, sponzorstvo aj všeobecné otázky. Odpovedáme typicky do 2 pracovných dní.",
      },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "Kontakt — subenai" },
      {
        property: "og:description",
        content: "Napíš nám priamo na email. Odpovedáme typicky do 2 pracovných dní.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: KONTAKT_URL },
    ],
    links: [{ rel: "canonical", href: KONTAKT_URL }],
  }),
  component: KontaktPage,
});

export function KontaktPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
        <header className="mb-10">
          <Link to={ROUTES.home} className="text-sm text-muted-foreground hover:text-foreground">
            ← Späť na domov
          </Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Kontakt
          </h1>
          <p className="mt-3 text-base text-muted-foreground sm:text-lg">
            Napíš nám priamo na e-mail. Odpovedáme typicky do{" "}
            <strong className="text-foreground">2 pracovných dní</strong>. Žiadny formulár, žiadny
            ticket systém — len reálny človek na druhej strane.
          </p>
        </header>

        <section className="mb-10 rounded-2xl border border-border/60 bg-card p-6 sm:p-8">
          <h2 className="text-lg font-semibold text-foreground">Hlavný e-mail</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Pre všetky typy správ. Klikni na tlačidlo nižšie a otvorí sa ti tvoj e-mailový klient.
          </p>
          <a
            href={buildMailto("Kontakt")}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-accent-gradient px-6 py-4 text-base font-bold text-primary-foreground shadow-glow transition-transform hover:scale-[1.01] active:scale-[0.99] sm:w-auto"
          >
            Napísať na {CONTACT_EMAIL}
            <span aria-hidden="true">→</span>
          </a>
          <p className="mt-3 text-xs text-muted-foreground">
            Ak ti tlačidlo nefunguje, skopíruj adresu ručne:{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-foreground">{CONTACT_EMAIL}</code>
          </p>
        </section>

        <section className="mb-10">
          <h2 className="text-lg font-semibold text-foreground">Vyber typ správy</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Predvyplníme predmet, aby tvoja správa rýchlejšie dorazila k správnemu človeku.
          </p>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {TOPICS.map((topic) => (
              <li key={topic.subject}>
                <a
                  href={buildMailto(topic.subject)}
                  className="block h-full rounded-2xl border border-border/60 bg-card p-4 transition-colors hover:border-primary/60"
                >
                  <span className="block text-sm font-semibold text-foreground">{topic.label}</span>
                  <span className="mt-1 block text-xs text-muted-foreground">{topic.hint}</span>
                </a>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-2xl border border-border/60 bg-card/60 p-6 text-sm text-muted-foreground sm:p-8">
          <h2 className="text-base font-semibold text-foreground">Prevádzkovateľ</h2>
          <p className="mt-2 leading-relaxed">
            <strong className="text-foreground">am.bonum s. r. o.</strong>
            <br />
            Škultétyho 1560/3, 052 01 Spišská Nová Ves
            <br />
            IČO 55 055 290 · DIČ 2121850005 · IČ DPH neevidované
            <br />
            Zapísaná v ORSR Mestského súdu Košice, oddiel Sro, vložka č. 55453/V
          </p>
          <p className="mt-4 leading-relaxed">
            Detaily o spracovaní osobných údajov sú v{" "}
            <Link to={ROUTES.privacy} className="text-primary underline underline-offset-2">
              Zásadách ochrany súkromia
            </Link>
            . Pre formálnu GDPR žiadosť stačí napísať na{" "}
            <a href={buildMailto("GDPR žiadosť")} className="underline underline-offset-2">
              {CONTACT_EMAIL}
            </a>{" "}
            s typom žiadosti v predmete (vymazanie / prístup / oprava / námietka).
          </p>
        </section>

        <Footer />
      </main>
    </div>
  );
}

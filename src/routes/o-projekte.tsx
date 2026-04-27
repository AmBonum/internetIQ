import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";
import { SITE_ORIGIN } from "@/config/site";
import { ROUTES } from "@/config/routes";
const ABOUT_URL = `${SITE_ORIGIN}/o-projekte`;

const aboutJsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  url: ABOUT_URL,
  name: "O projekte — subenai",
  inLanguage: "sk-SK",
  description:
    "Čo je projekt subenai, prečo je bezplatný, prečo sponsorship namiesto členstva a kam idú podporné príspevky.",
  isPartOf: {
    "@type": "WebSite",
    name: "subenai",
    url: SITE_ORIGIN,
  },
  publisher: {
    "@type": "Organization",
    name: "am.bonum s. r. o.",
    url: SITE_ORIGIN,
  },
};

export const Route = createFileRoute("/o-projekte")({
  head: () => ({
    meta: [
      { title: "O projekte — subenai" },
      {
        name: "description",
        content:
          "Čo je projekt, prečo sponsorship a kam idú peniaze. Transparentne, bez paywallu, bez perks.",
      },
      { name: "robots", content: "index, follow" },
      { property: "og:title", content: "O projekte — subenai" },
      {
        property: "og:description",
        content:
          "Bezplatný edukatívny nástroj pre slovenský digitálny svet. Prečo je projekt zadarmo a kam idú podporné príspevky.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: ABOUT_URL },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: ABOUT_URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify(aboutJsonLd),
      },
    ],
  }),
  component: AboutPage,
});

export function AboutPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
        <header className="mb-10">
          <Link to={ROUTES.home} className="text-sm text-muted-foreground hover:text-foreground">
            ← Späť na domov
          </Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Čo je subenai
          </h1>
          <p className="mt-4 text-lg font-semibold text-foreground sm:text-xl">
            Bezplatný edukatívny nástroj pre slovenský digitálny svet.
          </p>
        </header>

        <article className="prose prose-sm max-w-none space-y-8 text-foreground prose-headings:text-foreground prose-a:text-primary">
          <section
            aria-labelledby="ciel"
            className="space-y-3 rounded-2xl border border-border/60 bg-card p-6"
          >
            <h2 id="ciel" className="text-xl font-semibold">
              1. Cieľ projektu
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Vzdelávať verejnosť o digitálnych podvodoch — phishing, smishing, vishing, BEC,
              investičné scamy, romance scams, marketplace fraud. Každý slovenský občan by mal
              vedieť rozpoznať bežné scam pattern bez toho, aby pre to musel mať IT vzdelanie.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Merateľný impact: počet absolventov testu, kategórie objavených slabín na úrovni
              populácie, aktualizácie obsahu podľa toho, čo ľudia v testoch reálne nezvládajú.
            </p>
          </section>

          <section
            aria-labelledby="bezplatne"
            className="space-y-3 rounded-2xl border border-border/60 bg-card p-6"
          >
            <h2 id="bezplatne" className="text-xl font-semibold">
              2. Prečo bezplatné
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Paywall by zúžil cieľovú skupinu presne na tých, ktorí pomoc nepotrebujú.
              Najzraniteľnejšia demografia — seniori, dôchodcovia, ne-technickí používatelia — by sa
              k obsahu vôbec nedostala. Misia projektu je <strong>inklúzia</strong>, nie premium
              produkt.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Žiadny free tier vs. premium tier. Každá otázka, každý kurz, každý výsledok je
              prístupný komukoľvek bez registrácie.
            </p>
          </section>

          <section
            aria-labelledby="preco-sponsorship"
            className="space-y-3 rounded-2xl border border-border/60 bg-card p-6"
          >
            <h2 id="preco-sponsorship" className="text-xl font-semibold">
              3. Prečo sponsorship a nie členstvo
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Donation-povaha zachováva právnu čistotu — žiadny paid service, jednoduchšie
              účtovníctvo, žiadne sporné spotrebiteľské reklamácie pri „nedostatočnej kvalite
              produktu". Sponzori dostávajú <strong>uznanie</strong>, nie privilegia.
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Nechceme rozdeliť používateľov na dve triedy. Sponzor a anonymný návštevník dostávajú
              presne ten istý obsah. To je vedome vybraný kompromis: vďaka tomu projekt vie ostať
              bezplatný pre všetkých.
            </p>
          </section>

          <section
            aria-labelledby="kam-id-peniaze"
            className="space-y-3 rounded-2xl border border-border/60 bg-card p-6"
          >
            <h2 id="kam-id-peniaze" className="text-xl font-semibold">
              4. Kam idú peniaze
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Transparentný breakdown bežných nákladov (orientačné čísla, aktualizujeme raz ročne):
            </p>
            <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
              <li>
                <strong>Cloudflare hosting</strong> — ~5 €/mes (Pages + Workers)
              </li>
              <li>
                <strong>Supabase databáza</strong> — ~25 €/mes (Pro plán, EU región)
              </li>
              <li>
                <strong>Stripe poplatky</strong> — ~3 % z prijatých príspevkov (kartové +
                fakturačné)
              </li>
              <li>
                <strong>Tvorba nového obsahu</strong> — kurzy, otázky, scenáre, validácia
                respondentmi
              </li>
              <li>
                <strong>Audit a údržba</strong> — security review, dependency updates, bug fixy
              </li>
              <li>
                <strong>Občasné expert konzultácie</strong> — právnik, účtovník, GDPR konzultant
              </li>
            </ul>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Konkrétny zoznam zmien a deploy histórie pripravujeme na samostatnej stránke{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">/zmeny</code>.
            </p>
          </section>

          <section
            aria-labelledby="co-sponzori"
            className="space-y-3 rounded-2xl border border-border/60 bg-card p-6"
          >
            <h2 id="co-sponzori" className="text-xl font-semibold">
              5. Čo sponzori dostanú
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Žiadne platené výhody ani prémiové funkcie. Sponzorstvo je dobrovoľný príspevok, nie
              nákup balíčka. Voliteľne:
            </p>
            <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
              <li>
                Mention na stránke{" "}
                <code className="rounded bg-muted px-1 py-0.5 text-xs">/sponzori</code> — granularne
                (meno, voliteľný odkaz, krátka správa do 80 znakov), default je vypnuté
              </li>
              <li>
                Mention v päte stránky pri vyššom tier-i (jednorazovo ≥ 50 € alebo mesačný odber ≥
                25 €/mes), opt-in
              </li>
              <li>Faktúra pre účtovníctvo (Stripe Invoicing, EU-compliant, PDF na stiahnutie)</li>
              <li>
                Možnosť kedykoľvek <strong>zrušiť mesačný odber jediným klikom</strong> cez Stripe
                Customer Portal
              </li>
            </ul>
          </section>

          <section
            aria-labelledby="co-nerobime"
            className="space-y-3 rounded-2xl border border-border/60 bg-card p-6"
          >
            <h2 id="co-nerobime" className="text-xl font-semibold">
              6. Čo nerobíme (a kde je hranica)
            </h2>
            <ul className="list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted-foreground">
              <li>
                <strong>Žiadne reklamy v obsahu</strong> — ani vlastné, ani affiliate, ani natívne
              </li>
              <li>
                <strong>Sponzori nemôžu ovplyvňovať obsah</strong> — žiadne prefavoring scam
                patternov, žiadne menené klasifikácie, žiadne sponsored kurzy
              </li>
              <li>
                <strong>Žiadny paywall na bežné použitie</strong> — test, kurzy a výsledok sú
                zadarmo pre každého. Pri rastúcej prevádzke môžeme zaviesť mäkké limity na nadmerné
                používanie (napr. veľa testov denne z jednej IP) aby sme udržali náklady na hosting
                a databázu udržateľné. Bežný návštevník to nikdy nepocíti.
              </li>
              <li>
                <strong>Žiadne dark patterns</strong> — cancel mesačného odberu je jeden klik,
                žiadny „are you sure" loop, žiadne pause-tactics
              </li>
              <li>
                <strong>Žiadne tracking bez explicitného súhlasu</strong> — analytika ani
                marketingové nástroje sa nezapnú, kým ich nepovolíš v cookie banneri (kategórie
                „analytika" / „marketing"). Bez súhlasu žiadne pixely, žiadne externé skripty,
                žiadny remarketing. Súhlas môžeš kedykoľvek odvolať cez{" "}
                <Link
                  to={ROUTES.cookies}
                  className="underline underline-offset-2 hover:text-foreground"
                >
                  Nastavenia cookies
                </Link>
                .
              </li>
            </ul>
          </section>

          <section
            aria-labelledby="podporit"
            className="space-y-4 rounded-2xl border border-primary/40 bg-card p-6 text-center sm:p-8"
          >
            <h2 id="podporit" className="text-xl font-semibold">
              Chceš projekt podporiť?
            </h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Akákoľvek čiastka pomáha pokryť hosting, tvorbu nového obsahu a údržbu. Mesačná
              podpora od 5 € alebo jednorazovo. Faktúru dostaneš e-mailom.
            </p>
            <div className="flex flex-col items-center gap-3 pt-2 sm:flex-row sm:justify-center">
              <Link
                to={ROUTES.podpora}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-accent-gradient px-6 py-3 text-base font-bold text-primary-foreground shadow-glow transition-transform hover:scale-[1.03] active:scale-[0.99]"
              >
                Podporiť projekt
                <span aria-hidden="true">→</span>
              </Link>
              <Link
                to={ROUTES.sponzori}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-border/60 bg-background/60 px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-background"
              >
                Pozri sponzorov
              </Link>
            </div>
          </section>
        </article>

        <Footer />
      </main>
    </div>
  );
}

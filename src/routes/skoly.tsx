import { createFileRoute, Link } from "@tanstack/react-router";
import { Footer } from "@/components/Footer";
import { CONTACT_EMAIL, SITE_ORIGIN } from "@/config/site";
import { ROUTES } from "@/config/routes";

export const Route = createFileRoute("/skoly")({
  head: () => ({
    meta: [
      { title: "Pre školy a vzdelávacie inštitúcie — subenai" },
      {
        name: "description",
        content:
          "Ako pripraviť edu test pre triedu alebo tím, bezpečne ho zdieľať a otvoriť výsledky. Heslo, GDPR rola autora, retencia 12 mesiacov, CSV export.",
      },
      { name: "robots", content: "index, follow" },
    ],
  }),
  component: SkolyPage,
});

function SkolyPage() {
  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
        <header>
          <Link to={ROUTES.home} className="text-sm text-muted-foreground hover:text-foreground">
            ← Späť na domov
          </Link>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-foreground sm:text-4xl">
            Pre školy, lektorov a HR
          </h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground sm:text-lg">
            Edu mód v Composeri ti dovolí pripraviť test pre triedu alebo tím, zbierať odpovede s
            menom a e-mailom respondenta a pozrieť si výsledky cez heslom chránený dashboard. Žiadne
            účty, žiadne registrácie. Zadarmo.
          </p>
        </header>

        <article className="prose prose-sm mt-10 max-w-none space-y-8 text-foreground">
          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Čo to je</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Edu mód je opt-in nadstavba nad{" "}
              <Link to={ROUTES.zostav} className="underline underline-offset-2">
                Composer-om
              </Link>
              . Použijú ho učitelia (klasifikácia testu pre triedu), lektori (kontrola po školení)
              alebo HR (onboarding zamestnanca). V štandardnom režime sú odpovede úplne anonymné —
              edu mód je výnimka, kde respondent vedome odovzdáva meno a e-mail autorovi testu.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Krok 1: Vytvor test</h2>
            <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
              <li>
                Otvor{" "}
                <Link to={ROUTES.zostav} className="underline underline-offset-2">
                  Composer
                </Link>{" "}
                a označ predefinované sady alebo si poskladaj otázky ručne.
              </li>
              <li>Nastav prah úspešnosti (default 70 %) a počet otázok (5–50).</li>
              <li>Pomenuj zostavu (napr. „Trieda 9.A — Q1 2026").</li>
            </ol>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Krok 2: Zapni edu mód a heslo</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              V sekcii <strong>Nastavenia</strong> aktivuj prepínač „Zbierať odpovede s menom a
              e-mailom" a zadaj <strong>heslo na pozeranie výsledkov</strong> (min. 8 znakov). Heslo
              je tvoja jediná cesta späť k výsledkom — uložíme len bcrypt hash, originál neukladáme
              nikde.{" "}
              <strong className="text-foreground">Žiadny reset cez e-mail neexistuje.</strong>
            </p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Po kliknutí <em>„Vytvoriť edu test"</em> sa zobrazí dialóg s tromi polami: link pre
              respondentov, link na výsledky a heslo. Skopíruj všetky tri (password manager je
              ideálny) PRED tým, ako dialóg zatvoríš.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Krok 3: Pošli link respondentom</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Pošli <strong>link pre respondentov</strong> (verejný). Studenti / kolegovia uvidia
              intake formulár — zadajú meno, e-mail a explicitne odsúhlasia spracovanie osobných
              údajov. Bez súhlasu sa test nespustí.
            </p>
            <details className="rounded-lg border border-border/60 bg-card/40 p-3 text-sm">
              <summary className="cursor-pointer font-semibold text-foreground">
                Vzor e-mailu pre respondentov (copy-paste)
              </summary>
              <pre className="mt-3 overflow-x-auto whitespace-pre-wrap rounded bg-muted/40 p-3 text-xs text-foreground">
                {`Predmet: Test rozpoznávania scamov — {Trieda 9.A}

Ahoj,

pošli mi prosím výsledok tohto krátkeho testu (cca 5 min) o online
podvodoch. Pred testom ťa poprosí o meno a e-mail, aby som vedel kto
ako odpovedal — žiadne registrácie netreba.

Link: {public_url}

Vďaka,
{tvoje meno}`}
              </pre>
            </details>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Krok 4: Pozri výsledky</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Otvor <strong>link na výsledky</strong>, zadaj heslo a uvidíš:
            </p>
            <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
              <li>Súhrn: počet respondentov, priemer, min/max, medián, pass rate.</li>
              <li>Distribúciu skóre v 4 pásmach (0–24, 25–49, 50–74, 75–100).</li>
              <li>Tabuľku respondentov so sortovaním a vyhľadávaním.</li>
              <li>Možnosť zmazať konkrétneho respondenta (potvrdenie + audit log).</li>
              <li>
                <strong>CSV export</strong> všetkých odpovedí pre offline analýzu (Excel, Google
                Sheets).
              </li>
            </ul>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Session vydrží 60 minút. Po vypršaní sa zobrazí znova heslo. Brute-force ochrana: 5
              pokusov / 15 min / IP / test.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">GDPR — tvoja rola autora</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">
              Pri zbere mena a e-mailu si <strong className="text-foreground">ty kontrolór</strong>
              (čl. 4 ods. 7 GDPR) — určuješ účel a prostriedky.{" "}
              <strong>am.bonum s.&nbsp;r.&nbsp;o.</strong> je{" "}
              <strong className="text-foreground">sprostredkovateľ</strong> (čl. 28 GDPR) — dáta
              hostujeme na tvoj pokyn a po ňom ich aj vymažeme.
            </p>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-muted-foreground">
              <li>
                <strong>Doba uchovávania:</strong> 12 mesiacov od vytvorenia záznamu, potom
                automaticky meno + e-mail anonymizujeme. Skóre + odpovede ostávajú pre tvoju
                štatistiku.
              </li>
              <li>
                <strong>Práva respondenta:</strong> obracajú sa na teba (kontrolóra) — prístup (čl.
                15), oprava (čl. 16), vymazanie (čl. 17). My ti pomáhame ich realizovať cez
                dashboard (zmazať respondenta jedným klikom).
              </li>
              <li>
                <strong>Šablóna DPA:</strong> ak škola alebo firma žiada formálnu zmluvu o
                spracovaní, napíš nám na{" "}
                <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-2">
                  {CONTACT_EMAIL}
                </a>{" "}
                a pošleme šablónu.
              </li>
              <li>
                <strong>Disclosure pre respondentov:</strong> intake formulár sa pýta autora
                (Pomenovanie zostavy), uvádza retenciu 12 mes a linkuje{" "}
                <Link to={ROUTES.privacy} className="underline underline-offset-2">
                  zásady spracovania
                </Link>
                . O tomto by si si nemusel/a starať — máš to v cene.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-xl font-semibold">Časté otázky</h2>
            <dl className="space-y-3 text-sm leading-relaxed text-muted-foreground">
              <div>
                <dt className="font-semibold text-foreground">
                  Stratil/a som heslo. Môžete mi ho resetovať?
                </dt>
                <dd className="mt-1">
                  Nie. Heslo ukladáme len ako bcrypt hash, originál nemáme. Vytvor nový edu test a
                  zdieľaj nový link — staré výsledky bohužiaľ stratíš.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-foreground">Ako dlho sa uchovávajú odpovede?</dt>
                <dd className="mt-1">
                  Meno + e-mail respondenta = 12 mesiacov, potom auto-anonymizácia. Skóre a detail
                  odpovedí ostávajú pre tvoju štatistiku.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-foreground">
                  Môžem zmazať konkrétneho študenta?
                </dt>
                <dd className="mt-1">
                  Áno. V dashboarde (link na výsledky) klikni na ikonu koša pri jeho riadku —
                  potvrdíš a riadok zmizne natrvalo.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-foreground">
                  Koľko respondentov môže absolvovať jeden test?
                </dt>
                <dd className="mt-1">
                  Max 50 pokusov / hodinu / test (anti-spam). V praxi pre triedu alebo tím postačí,
                  väčšie zbery rozdeľ na viacero zostáv.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-foreground">
                  Môže sa študent prihlásiť opakovane?
                </dt>
                <dd className="mt-1">
                  Nie — jeden e-mail = jeden záznam. Ak naozaj potrebuješ retest, zmaž starý záznam
                  v dashboarde a študent sa môže prihlásiť znova.
                </dd>
              </div>
              <div>
                <dt className="font-semibold text-foreground">Funguje to na mobile?</dt>
                <dd className="mt-1">Áno, intake formulár aj dashboard sú mobile-first.</dd>
              </div>
            </dl>
          </section>
        </article>

        <div className="mt-10 rounded-2xl border border-border/60 bg-card/40 p-6 text-sm leading-relaxed text-muted-foreground">
          <p>
            Pripravený? Otvor{" "}
            <Link
              to={ROUTES.zostav}
              className="font-semibold text-foreground underline underline-offset-2"
            >
              Composer
            </Link>{" "}
            a vytvor svoj prvý edu test. Otázky alebo požiadavku na DPA pošli na{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className="underline underline-offset-2">
              {CONTACT_EMAIL}
            </a>
            .
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            <strong>{SITE_ORIGIN}</strong> · ©&nbsp;am.bonum s.&nbsp;r.&nbsp;o.
          </p>
        </div>

        <Footer />
      </main>
    </div>
  );
}

# PLAN — Custom tests + Sponsorship (2026-04-26)

> **Source request**: (a) používateľ chce vyskladať si test na mieru — buď
> z predefinovaných sád pre rôzne firemné zamerania (strojová výroba,
> dispečing, softvérový vývoj, verejné služby, e-shop, servis, gastro,
> doprava, …) alebo cez manuálny picker zo zoznamu otázok; pridať aspoň
> 100 nových otázok vrátane legitímnych príkladov (URL/SMS, ktoré sú OK,
> alebo niečo, čo "vyzerá podozrivo, ale nie je"). (b) Implementovať
> sponzorovanie projektu — jednorazovo alebo mesačne od 5 EUR, prepojené
> so SRO IBAN cez Stripe, s faktúrou, plne v súlade so SK + EÚ legislatívou,
> senior-level v každej rovine (kód, právo, UX, bezpečnosť).

**Format:** Tento dokument je **index**. Každá user story žije v
[`stories/`](./stories/). Toto je single-page overview pre product
owner, vývojára aj reviewera.

## Obsah

- [Discovery — čo už máme](#discovery--čo-už-máme)
- [Cross-cutting decisions](#cross-cutting-decisions)
- [Suggested execution order](#suggested-execution-order)
- [Epic & story mapa](#epic--story-mapa)
- [Risk & non-functional matrix](#risk--non-functional-matrix)
- [Open questions for product owner](#open-questions-for-product-owner)
- [Copyright + UX + Legal guardrails (binding)](#copyright--ux--legal-guardrails-binding)

---

## Discovery — čo už máme

(Stav k 2026-04-26, po E1–E6 + perf optimization.)

| Vec | Stav | Dôsledok pre plán |
|---|---|---|
| Question bank `src/lib/quiz/questions.ts` (~100 SK scam scenarios) | Hotové, 5 kategórií, 14 honeypot otázok | E9 expanduje na 200+, prevažne honeypot a legit-look examples |
| `getTestQuestions()` — random 15 z banku s category quotas | Hotové (`TEST_SIZE = 15`) | E7 doplní `getTestQuestionsForPack(slug)` ktorý vyberá podľa pack manifestu |
| `TestFlow` + sessionStorage persistence + scrollRestoration | Hotové (cdd097e) | E7/E8 musia honoritovať že "/test" má vlastný session state |
| Course system pod `/kurzy` + Zod schema + Schema.org JSON-LD | Hotové, 8 kurzov | E7 industry packs reusne ten istý content authoring pattern |
| Supabase `attempts` tabuľka + RLS + 36-mesačná retencia (pg_cron) | Hotové | E10 pridá `sponsors` tabuľku v rovnakom RLS-strict štýle |
| Privacy + cookies stránka, `CONSENT_VERSION 1.1.0` | Hotové, kontakt `segnities@gmail.com` | E10 vyžaduje bump na 1.2.0 (nový "payment" data category) |
| `public/_headers` CSP — `connect-src 'self' https://*.supabase.co` | Hotové | E10 rozšíri o `js.stripe.com` + `api.stripe.com` + `q.stripe.com` |
| Hosting: Cloudflare Pages free tier | Hotové | Webhook musí ísť cez Cloudflare Pages Functions (rovnaký provider, žiadny ďalší vendor) |
| `.dev.vars` pre lokálne env vars | Existuje | E10 pridá Stripe secret key + webhook secret |

---

## Cross-cutting decisions

Tieto rozhodnutia platia pre celý plán. Ak ich budeme meniť, treba
update všetkých dotknutých stories.

### Custom tests

1. **Industry packs sú statické TS moduly**, NIE DB. Žijú v
   `src/content/test-packs/{slug}.ts`, registrované v
   `src/content/test-packs/index.ts` (rovnaký pattern ako kurzy).
   Schéma cez Zod, slug uniqueness assertion v build-time. Prečo:
   nepotrebujeme admin UI, content je relatívne statický a verzovaný v gite.
2. **Pack metadata** = `{ slug, title, tagline, industryEmoji, targetPersona,
   recommendedQuestionIds: string[], honeypotRatio: number,
   passingThreshold: number }`. `recommendedQuestionIds` je explicitný
   zoznam z banku — autor packu manuálne vyberie 12-20 otázok ktoré
   najlepšie pasujú industry. **Nemixujeme heuristikou**, lebo
   senior content review je dôležitejší ako automatika.
3. **Manuálny builder** (`/test/builder`) je čisto klientský picker —
   žiadne ukladanie do DB pokým user neklikne "Zdieľaj zostavu". Vtedy
   `POST /api/test-sets` (cez Supabase RPC) vytvorí riadok v `test_sets`
   tabuľke s `set_id` UUID a `question_ids JSONB[]`. Share URL:
   `/test/zostava/{set_id}`. RLS: anon SELECT podľa set_id, anon INSERT.
4. **Sharing builder cez URL bez DB** ako fallback — base64-encoded
   question IDs v query string `/test/builder?ids=eyJxIjpbInAtc21zL...`
   pre malé sady (<10 otázok), inak DB.
5. **TEST_SIZE flexibility** — pack autori si volia 8–25 otázok, builder
   user 5–25. `<5` = málo signálu, `>25` = unija fatigue.
6. **Honeypot ratio per-pack** — niektoré packy (napr. eshop) majú
   vyšší podiel legit otázok než štandardné 27 % (4/15 v base teste),
   aby učili dôveryhodnosť. Nastaviteľné v pack manifeste.
7. **Scoring je rovnaké** — všetky packy + builder testy idú cez
   `computeScore()` bez zmeny. Pack-level "Vyhovuje pre {industry}"
   badge sa zobrazuje iba ak `finalScore >= pack.passingThreshold`.

### Sponsorship

8. **Stripe je výherca** spomedzi kandidátov (Revolut Business — slabšie
   recurring API; GoCardless — direct debit only, neuniverzálne pre EÚ;
   čisté SEPA bankový transfer — chýba SCA, žiadny self-service portál).
   Stripe pokrýva karty + SEPA + Apple/Google Pay + recurring + invoicing
   + customer portal. Poplatky: ~1.5 % + 0.25 EUR pre EÚ karty.
9. **Webhook na Cloudflare Pages Functions** (nie Supabase Edge Function) —
   držíme jeden vendor (CF Pages) na celý serverless layer. Function
   path: `/functions/api/stripe-webhook.ts`. Verifikácia podpisu cez
   `STRIPE_WEBHOOK_SECRET` env var.
10. **Donation = paid service**, nie "dar" — slovenský `s.r.o.` zo zákona
    nemôže prijímať dary v zmysle občianskeho zákonníka bez darovacej
    zmluvy. Preto označujeme transakciu ako **"podpora vývoja"** — ide
    o platenú službu (informačný produkt) a podlieha DPH ak je platca DPH.
    **Otvorená otázka pre PO**: je s.r.o. platcom DPH? (Hranica obratu
    49 790 EUR/12 mesiacov.) Ak áno, faktúra musí obsahovať DPH a
    "podpora" je 23 % zdaniteľný príjem. Ak nie, faktúra bez DPH s
    poznámkou "Nie sme platcami DPH podľa § 4 ZDPH".
11. **Faktúru generuje Stripe Invoicing** (built-in, EU-compliant,
    podporuje SK fakturačné polia: IČO, DIČ, IČ DPH; PDF download;
    automatické emailovanie). Manuálny PDF render + SendGrid by bola
    duplicate work. Stripe poplatok za invoicing: 0 EUR pre Subscriptions,
    0.4 % per faktúru pre custom invoices.
12. **Recurring (mesačne)** = Stripe Subscriptions. Self-service
    cancel + update card cez Stripe Customer Portal (hosted) — žiadny
    custom UI, žiadne dark patterns, single click cancel. Customer
    Portal link sa pošle e-mailom po prvej platbe.
13. **Anonymita donora**: pri checkout-e checkbox "Zobraziť ma na
    `/sponzori` stránke" (default OFF). Pri OFF: v Supabase ukladáme
    iba `donor_label = "Anonymný podporovateľ"`. Stripe stále má
    plné údaje (e-mail, meno) pre faktúru a AML compliance.
14. **DB schéma sponzorstva** v migrácii `20260427000000_sponsors.sql`:
    - `sponsors` — `id`, `stripe_customer_id`, `display_name|null` (NULL
       = anonymous), `created_at`, `total_eur` (cumulative)
    - `donations` — `id`, `sponsor_id FK`, `stripe_payment_intent_id`,
       `amount_eur`, `currency`, `kind` (`oneoff|subscription_invoice`),
       `created_at`, `invoice_pdf_url|null`
    - `subscriptions` — `id`, `sponsor_id FK`, `stripe_subscription_id`,
       `status`, `monthly_eur`, `started_at`, `cancelled_at|null`
    - RLS: anon `INSERT` (cez webhook signing? actually webhook používa
       service role) a `SELECT` len pre `display_name IS NOT NULL` riadky
       cez verejný view `public_sponsors`. Žiadny anon UPDATE/DELETE.
15. **GDPR + retencia donor data**: meno + e-mail + fakturačné údaje =
    nová kategória "platobné údaje" v privacy policy. Retencia podľa
    `Zákon č. 431/2002 Z.z. o účtovníctve` = **10 rokov** pre účtovné
    doklady (faktúry). To je dlhšie než 36-mesačná retencia attempts.
    Bump `CONSENT_VERSION` na **1.2.0**.
16. **CSP rozšírenie** v `public/_headers`:
    `script-src` += `https://js.stripe.com`,
    `connect-src` += `https://api.stripe.com https://q.stripe.com`,
    `frame-src 'self' https://js.stripe.com https://hooks.stripe.com` (pre 3DS challenge),
    `img-src` += `https://*.stripe.com`.
17. **PSD2 / SCA** — Stripe Payment Element handles natively.
    3D Secure 2.0 challenge pre EÚ karty automaticky.
18. **AML compliance** — slovenský zákon č. 297/2008 Z.z. **nevyžaduje
    KYC pre transakcie pod 1 000 EUR** od nepodnikateľa. Maximálnu
    jednorazovú donáciu nastavujeme na **500 EUR** (custom amount).
    Mesačné odbery cez kartu Stripe sám rieši cez SCA.
19. **Spotrebiteľská zmluva na diaľku** + 14-dňové právo na odstúpenie:
    pri **digitálnom obsahu / službe poskytnutej okamžite** sa právo
    na odstúpenie *nevzťahuje*, ak spotrebiteľ pred plnením výslovne
    súhlasil so začatím poskytovania (§ 7 ods. 6 zákona č. 102/2014
    Z.z.). UI musí mať explicitný checkbox: "Súhlasím so začatím
    poskytovania okamžite a beriem na vedomie stratu práva na
    odstúpenie."
20. **Bundle impact**: Stripe.js sa dynamicky načíta iba na
    `/podpora` route (lazy import + Suspense). Main chunk zostáva
    pod 30 KB gzip.
21. **Sponsor perks tiering** — keďže perks (Discord komunita, footer mention)
    posúvajú právnu povahu z čistej donácie na *paid service*, ale am.bonum
    nie je platca DPH, faktúra zostáva bez DPH s povinnou poznámkou.
    Tier pravidlá:
    - **Discord prístup**: pri akomkoľvek úspešnom one-off ≥ 5 € alebo
      aktívnej mesačnej subscripcii. Manuálny email invite v MVP.
    - **Footer mention** (samostatný consent flag `show_in_footer`):
      gated cez SQL view `footer_sponsors` filtrujúci `total_eur >= 50`
      (one-off cumulatív) ALEBO `monthly_eur >= 25` (active sub).
      Anonymita zostáva default OFF; user musí zaškrtnúť explicitne pri
      checkout-e.
    - **Ad-free** je symbolický (žiadne reklamy v projekte) — disclose
      v copy ale žiadny code-side.

---

## Suggested execution order

Hlavný driver: **najprv čo odomyká ostatné**. Question bank expansion
je predpoklad pre industry packs. Sponsorship infra (DB, webhook) musí
byť pred UI. Legal docs musia byť pred go-live sponzorstva.

```
=== Custom tests track ===
1.  E9.1   +30 legit-URL questions             (S,  P1)  ← unblocks E7
2.  E9.2   +20 legit-SMS / borderline-OK       (S,  P1)
3.  E9.3   +20 industry-specific scams         (S,  P2)
4.  E9.4   +30 honeypot / "vyzerá podozrivo"   (S,  P2)
5.  E7.1   Test pack content schema + registry (S,  P1)
6.  E7.2   Industry packs batch A (5 packs)    (M,  P1)
7.  E7.3   Industry packs batch B (5 packs)    (M,  P2)
8.  E7.4   Industry packs batch C (5 packs)    (M,  P3)
9.  E7.5   /test/firma/$slug route + SEO       (M,  P1)
10. E7.6   /test/firma index discovery page    (S,  P2)
11. E8.1   test_sets DB migration + RLS        (XS, P2)
12. E8.2   /test/builder picker UI             (M,  P2)
13. E8.3   /test/zostava/$id share route       (S,  P2)

=== Sponsorship track ===
14. E10.1  Legal + Stripe arch decision doc    (S,  P1)
15. E10.2  Sponsors DB schema + RLS migration  (S,  P1)
16. E10.3  Stripe Pages Function webhook       (M,  P1)
17. E10.4  CSP + .dev.vars + secrets setup     (XS, P1)
18. E10.5  Privacy + CONSENT_VERSION 1.2.0     (S,  P1)
19. E11.1  /podpora donate page UI             (M,  P1)
20. E11.2  /podakovanie/$token thank-you page  (S,  P2)
21. E11.3  /sponzori public list page          (S,  P2)
22. E11.4  Footer link + cancellation flow     (XS, P2)
23. E11.5  Refund + AML edge cases playbook    (S,  P3)
```

E9.1–E9.4 môžu ísť paralelne (rôzne otázky, žiadny code conflict).
E10.1 (decision doc) musí byť **prvé v sponsorship tracku** — robí
rozhodnutia o platcovi DPH, faktúrach, refunde, AML. Bez nej E10.2+
zlyhajú na nepriamych voľbách.

---

## Epic & story mapa

### Epic 7 — Industry test packs

| story | title | effort | priority | status | deps |
|---|---|---|---|---|---|
| [E7.1](./stories/E7.1-test-pack-schema.md) | Test pack content schema + registry | S | P1 | 🟡 Ready | E9.1 (banky musia obsahovať priemyselné otázky) |
| [E7.2](./stories/E7.2-industry-packs-batch-a.md) | Industry packs A: e-shop, gastro, autoservis, IT, vereje sluzby | M | P1 | ⛔ Blocked | E7.1 |
| [E7.3](./stories/E7.3-industry-packs-batch-b.md) | Industry packs B: dispečing, doprava, marketing, zdravotnictvo, skoly | M | P2 | ⛔ Blocked | E7.1 |
| [E7.4](./stories/E7.4-industry-packs-batch-c.md) | Industry packs C: strojová výroba, pneuservis, SME účto, HORECA, servis | M | P3 | ⛔ Blocked | E7.1 |
| [E7.5](./stories/E7.5-firma-route.md) | `/test/firma/$slug` route + SEO + Quiz JSON-LD | M | P1 | ⛔ Blocked | E7.1 |
| [E7.6](./stories/E7.6-firma-index.md) | `/test/firma` discovery page | S | P2 | ⛔ Blocked | E7.5 |

### Epic 8 — Manual test builder

| story | title | effort | priority | status | deps |
|---|---|---|---|---|---|
| [E8.1](./stories/E8.1-test-sets-migration.md) | `test_sets` table migration + RLS + retention | XS | P2 | 🟡 Ready | — |
| [E8.2](./stories/E8.2-builder-picker-ui.md) | `/test/builder` filter + picker + start | M | P2 | ⛔ Blocked | E8.1 |
| [E8.3](./stories/E8.3-zostava-route.md) | `/test/zostava/$id` shareable saved set | S | P2 | ⛔ Blocked | E8.1, E8.2 |

### Epic 9 — Question bank +100

| story | title | effort | priority | status | deps |
|---|---|---|---|---|---|
| [E9.1](./stories/E9.1-legit-url-questions.md) | +30 legitimate URL examples (banking, e-shop, eGov) | S | P1 | 🟡 Ready | — |
| [E9.2](./stories/E9.2-legit-sms-borderline.md) | +20 legit SMS + borderline-suspicious-but-OK | S | P1 | 🟡 Ready | — |
| [E9.3](./stories/E9.3-industry-specific-scams.md) | +20 industry-specific scam scenarios | S | P2 | 🟡 Ready | — |
| [E9.4](./stories/E9.4-honeypot-extension.md) | +30 honeypot / „vyzerá podozrivo, ale nie je" | S | P2 | 🟡 Ready | — |

### Epic 10 — Sponsorship infrastructure

| story | title | effort | priority | status | deps |
|---|---|---|---|---|---|
| [E10.1](./stories/E10.1-legal-architecture-doc.md) | Legal + Stripe architecture decision doc (DPH, AML, faktúra) | S | P1 | 🟡 Ready | — |
| [E10.2](./stories/E10.2-sponsors-schema.md) | `sponsors` + `donations` + `subscriptions` migration + RLS | S | P1 | ⛔ Blocked | E10.1 |
| [E10.3](./stories/E10.3-stripe-webhook-function.md) | CF Pages Function — Stripe webhook handler | M | P1 | ⛔ Blocked | E10.2 |
| [E10.4](./stories/E10.4-secrets-csp-setup.md) | CSP + `.dev.vars` + Cloudflare env vars + Stripe keys | XS | P1 | ⛔ Blocked | E10.1 |
| [E10.5](./stories/E10.5-privacy-consent-bump.md) | Privacy update + `CONSENT_VERSION` 1.2.0 + cookie matrix update | S | P1 | ⛔ Blocked | E10.1 |

### Epic 11 — Sponsorship UI + invoicing

| story | title | effort | priority | status | deps |
|---|---|---|---|---|---|
| [E11.1](./stories/E11.1-podpora-page.md) | `/podpora` donate page (oneoff + monthly + Stripe Element) | M | P1 | ⛔ Blocked | E10.3, E10.5 |
| [E11.2](./stories/E11.2-podakovanie-page.md) | `/podakovanie/$token` thank-you + invoice download | S | P2 | ⛔ Blocked | E11.1 |
| [E11.3](./stories/E11.3-sponzori-list.md) | `/sponzori` public donor list (consent-gated) | S | P2 | ⛔ Blocked | E11.1 |
| [E11.4](./stories/E11.4-footer-cancel-flow.md) | Footer link + Stripe Customer Portal cancel | XS | P2 | ⛔ Blocked | E11.1 |
| [E11.5](./stories/E11.5-refund-aml-playbook.md) | Refund SOP + AML threshold playbook | S | P3 | ⛔ Blocked | E11.1 |

**Total: 22 stories** (6 + 3 + 4 + 5 + 4).

---

## Risk & non-functional matrix

| Riziko | Pravdepodobnosť | Dopad | Mitigácia |
|---|---|---|---|
| Stripe webhook spoofing → fake donations v DB | nízka | vysoký | `STRIPE_WEBHOOK_SECRET` signature verification v každom requeste; `idempotencyKey` na charge create |
| DPH chybne nastavená → daňová pokuta | stredná | vysoký | E10.1 vyžaduje rozhodnutie pred E10.2; pri pochybnosti účtovník |
| 14-dňové právo na odstúpenie nesprávne aplikované | stredná | stredný | UI checkbox "Súhlasím so začatím okamžite" pred každým checkout; rovnaký pattern používa Stripe |
| GDPR — donor údaje 10 rokov retencia konfliktuje s 36-mes. attempts | nízka | nízky | Privacy explicitne uvádza dve odlišné retencie (účtovné záznamy = 10r, hracie údaje = 36m) |
| Bundle blow-up po pridaní Stripe.js | stredná | nízky | Lazy load iba na `/podpora`, dynamic import; main chunk pod 30 KB gzip |
| Industry pack content drift voči realnym hrozbam | stredná | nízky | Pack metadata má `updatedAt`; aspoň jeden refresh pass ročne |
| Manuálny builder umožní "skreslené" testy | nízka | nízky | Min. 5 otázok hard limit; pack-level passing threshold sa neudeľuje builder testom (žiadny "Vyhovuje pre …" badge) |
| Sponzori vidia mená ostatných v networking response | nízka | vysoký | RLS view `public_sponsors` filtruje `display_name IS NOT NULL`; webhook používa service role, nikdy anon |
| Stripe Customer Portal je v EN namiesto SK | istá | nízky | Stripe ponúka SK lokalizáciu od Q2/2025; momentálne fallback EN s SK header note pri linku |
| AML hranica 1 000 EUR prekročená jednorazovou donáciou | nízka | stredný | Hard limit `max_amount_eur = 500` v UI; webhook validuje znova; vyššie sumy iba bankovým prevodom mimo Stripe |
| Anti-tracker bundle audit zlyhá kvôli Stripe.js | stredná | nízky | `scripts/check-bundle-no-trackers.sh` whitelist Stripe domény |

---

## Open questions for product owner

> Status k 2026-04-27 — väčšina zatvorená; zostáva niekoľko volieb pre E11.

### ✅ Confirmed company facts (am.bonum s. r. o.)

| Pole | Hodnota | Zdroj |
|---|---|---|
| Obchodné meno | **am.bonum s. r. o.** | ORSR — Mestský súd Košice, Sro 55453/V |
| IČO | **55 055 290** | ORSR výpis |
| DIČ | **2121850005** | FinStat profile |
| **IČ DPH (VAT ID)** | **❌ NEREGISTROVANÉ** | VIES check `SK2121850005` → invalid |
| Sídlo | Škultétyho 1560/3, 052 01 Spišská Nová Ves | ORSR |
| Konateľ | Ľubomír Volčko (samostatne) | ORSR |
| Deň zápisu | 23.11.2022 | ORSR |
| Veľkosť | mikropodnik (~4 440 € total assets, 2024) | FinStat |

**Dôsledok pre invoicing**: faktúry **bez DPH** s povinnou poznámkou *„Nie sme platcami DPH podľa § 4 zákona č. 222/2004 Z.z."* — Stripe Invoicing podporuje toto cez „Tax exempt" status zákazníka + custom footer. Žiadny reverse charge, žiadny OSS register kým obrat zostáva pod 49 790 €/12m. **Treba sledovať obrat** — pri prekročení limitu nasleduje povinná registrácia v 30 dňoch.

### ✅ Decisions confirmed by PO

1. ~~**Je tvoja s.r.o. platcom DPH?**~~ ✅ **NIE** (overené cez VIES)
2. ~~**DIČ + IČ DPH**~~ ✅ DIČ 2121850005, IČ DPH neexistuje
3. **Sídlo s.r.o. + IBAN Tatra Banky** — sídlo overené, IBAN treba pri Stripe registrácii (E10 implementation)
4. ~~**Geografický scope**~~ ✅ **SK + EÚ** (žiadne US/UK rohy)
5. ~~**Existuje už Stripe účet?**~~ ✅ **NIE** — registrácia v rámci E10 implementation (1–3 dni verifikácia)
7. ~~**Perks pre sponzorov?**~~ ✅ **ÁNO — selektívne v MVP**:
   - **Ad-free** — symbolické (nemáme reklamy), žiadna implementácia
   - **Discord komunita** — uzavretá Discord skupina pre sponzorov (manuálny invite cez email po platbe v MVP; Stripe → Discord role automation neskôr)
   - **Mention v footri** — top tier sponzori (mesačný odber ≥ 25 €/mes alebo jednorazovo ≥ 50 €) sa zobrazia v `<SiteFooter>` na každej stránke; consent-gated cez `display_name IS NOT NULL`
   - **Early access** ❌ NIE — nepotrebné komplikuje workflow
   - **Custom badge** ❌ NIE — neúmerný overhead pre MVP
9. ~~**Maximálna jednorazová suma 500 EUR**~~ ✅ **POTVRDENÉ** (výrazne pod AML hranicou 1 000 € per zákon č. 297/2008 Z.z. ⇒ žiadny KYC overhead)

### 🟡 Open — treba ešte rozhodnúť pred E10.1 / E11.1

6. **Označenie transakcie**: navrhujem **„Podpora rozvoja Internet IQ Test"** (jasne donation-style, ne-členský príspevok kvôli daňovej čistote pri ne-platcovi DPH). Súhlasíš?
8. **Mesačné levels** — odporúčanie **5 / 10 / 25 EUR/mes** (žiadne 50+ — psychologicky drahé pre charity-style projekt). Súhlasíš?
10. **Verejný `/sponzori` zoznam v MVP?** — odporúčanie **ÁNO** (sociálny dôkaz, low-effort, view-based, anonymita default OFF). Súhlasíš?
11. **Refund policy** — odporúčanie **„No refunds, ale cancel anytime na monthly"** s explicit checkboxom pri checkoute *„Súhlasím so začatím okamžite a beriem na vedomie stratu práva na odstúpenie"* (per § 7 ods. 6 zákona č. 102/2014 Z.z.). Pri sporných prípadoch full refund manuálne cez Stripe (E11.5 runbook).
12. **Industry pack `passingThreshold`** — odporúčanie **70 %**. Súhlasíš?
13. **Pack autorské copyrights** — odporúčanie **am.bonum s. r. o.** ako autor (centralizovaná IP, neskôr ľahší licensing). Súhlasíš?

---

## Copyright + UX + Legal guardrails (binding)

Tieto pravidlá platia pre **každú story** v tomto pláne. Reviewer ich kontroluje pred merge.

1. **Žiadne reálne brandy v scam vzoroch** — vždy "vyzerá ako Slovenská pošta" s typo doménou, nikdy presný klon. Logá iba v honeypot legit otázkach (kde je brand reálny vlastník komunikácie).
2. **Sources required** — každá štatistika v packu / question explanation má odkaz v `sources[]` (NBÚ, NCKB, polícia.sk, NBS, Europol).
3. **Mobile-first** — celý builder UX otestovaný na 375×667 viewport. Picker chips wrap, žiadny horizontálny scroll.
4. **Accessibility** — picker je keyboard-navigable (Tab + Enter + Space), filter chips majú `aria-pressed`, screen reader announce-uje počet vybraných otázok.
5. **No dark patterns** — Stripe Customer Portal cancel je 1 click; žiadny "Are you sure?" loop; žiadne "Pause subscription" tactics.
6. **GDPR Art. 13 disclosure** — `/podpora` form má pred checkout-om viditeľný panel "Aké údaje spracujeme: e-mail (faktúra), meno (faktúra), kartové údaje (Stripe, my ich nikdy nevidíme), suma. Retencia účtovné záznamy 10 rokov."
7. **Anonymity by default** — checkbox "Zobraziť ma v zozname sponzorov" je **OFF** by default.
8. **No cookie wall** — `/podpora` funguje aj pri rejected analytics consent.
9. **Footer credit pravidlo** — sponzori s `display_name` set sa môžu zobraziť v `/sponzori`, NIE automaticky v footri (footer credit je pre top-tier alebo special arrangements, riešené ad-hoc).
10. **Slovak language** — všetky user-facing strings v SK, vrátane Stripe Checkout (Stripe podporuje `locale: 'sk'`).
11. **Right of withdrawal disclosure** — pred checkoutom explicit text + checkbox.
12. **AML check** — webhook validuje `amount_eur <= 500` a odmietne vyššie (vráti 400 do Stripe). Stripe prijme refund automaticky.
13. **Ratelimit `/podpora` POST** — Cloudflare Pages Functions má built-in rate limiting; nastaviť 10 req/min/IP aby sa zamedzilo card-testing.
14. **Test packs sources** — pack manifest má `sources[]` pole rovnako ako kurzy, autor uvedie odkiaľ má rebríčky priemyselných hrozieb (napr. ENISA Threat Landscape pre IT, ENISA pre healthcare).

---

## Timeline (orientačný, pri 4 hod/deň)

- **Týždeň 1**: E9.1 + E9.2 + E9.3 + E9.4 (paralelne), +100 otázok hotových.
- **Týždeň 2**: E7.1, E7.5, E7.6, E7.2.
- **Týždeň 3**: E10.1 + E10.4 + E10.5 (legal + secrets + privacy) — gatekeep.
- **Týždeň 4**: E10.2 + E10.3 (DB + webhook).
- **Týždeň 5**: E11.1 + E11.2 + E11.3 + E11.4.
- **Týždeň 6**: E7.3 + E7.4 + E8 (manual builder + B/C industry packs).
- **Týždeň 7**: E11.5 + soak time + go-live.

---

## Definition of Done

Pozri [`tasks/README.md`](./README.md#definition-of-done-každá-story).

# E10 — Sponsorship: Legal + Stripe architecture decisions

**Status:** ✅ Sign-off pending PO confirmation (2026-04-27)
**Author:** Internet IQ Test team / am.bonum s. r. o.
**Reviewer:** PO + voliteľne externý účtovník

> Tento dokument zaznamenáva rozhodnutia urobené **pred** prvou riadkou
> kódu sponsorship feature-y. Každá story v E10/E11 cite konkrétny
> bod tohto doc-u. Pri zmene zákona / rozhodnutia stačí update tu —
> downstream stories sa upravia podľa neho.

## Executive summary

am.bonum s. r. o. (IČO 55 055 290, neplatca DPH) bude prijímať dobrovoľné
podporné platby cez **Stripe Checkout** (hosted, EÚ-locale). Jednorazovo
do **500 EUR** alebo mesačne 5/10/25 EUR. Faktúra **bez DPH** generovaná
Stripe Invoicing s povinnou poznámkou „Nie sme platcami DPH podľa § 4
zákona č. 222/2004 Z. z.". Webhook na Cloudflare Pages Functions, DB v
Supabase. **Žiadne refunds** + **cancel anytime** pre subscriptions,
explicit checkout-time waiver práva na odstúpenie. **Anonymita default
ON**, opt-in zoznam sponzorov + footer mention pri vyšších tier-och.
Email cez Resend. Privacy bump na CONSENT_VERSION 1.2.0. AML pod
1 000 EUR threshold per zákon č. 297/2008 Z. z. — žiadne KYC.

---

## Obsah

- [1. Právna povaha transakcie](#1-právna-povaha-transakcie)
- [2. DPH stratégia](#2-dph-stratégia)
- [3. Faktúra obsah](#3-faktúra-obsah)
- [4. Spotrebiteľská zmluva na diaľku](#4-spotrebiteľská-zmluva-na-diaľku)
- [5. AML compliance](#5-aml-compliance)
- [6. GDPR Art. 13 disclosure](#6-gdpr-art-13-disclosure)
- [7. Stripe vs. alternatívy](#7-stripe-vs-alternatívy)
- [8. Webhook host](#8-webhook-host)
- [9. Anonymita mechanizmus](#9-anonymita-mechanizmus)
- [10. Refund policy](#10-refund-policy)
- [11. Retencia donor data](#11-retencia-donor-data)
- [12. CSP zmena](#12-csp-zmena)
- [Open items pred go-live](#open-items-pred-go-live)

---

## 1. Právna povaha transakcie

**Rozhodnutie**: transakcia je **„podpora rozvoja informačného produktu"** —
formálne *paid service* (informačný produkt poskytovaný projektom Internet
IQ Test), nie dar. Označovanie „donation" v UI je marketingové; právna
podstata zostáva paid service.

**Rationale**:
- Slovenský `s.r.o.` zo zákona nemôže prijímať dary v zmysle § 628 OZ bez
  darovacej zmluvy. Dar od fyzickej osoby s.r.o. je administratívne ťažký
  (písomná darovacia zmluva, oznamovanie u FS, kategorizácia ako iný
  príjem zdaniteľný 19 %).
- Paid service je administratívne najjednoduchší mechanizmus — Stripe
  generuje faktúru, my účtujeme cez bežné podnikateľské knihy.
- „Členský príspevok" by vyžadoval členské stanovy a register členov —
  out of scope pre MVP.

**Dôsledok**: faktúrna položka znie **„Podpora rozvoja Internet IQ Test —
{oneoff|monthly}"**. Žiadne perks (Discord, early access) ktoré by
posúvali interpretáciu na *spotrebiteľskú zmluvu o digitálnom obsahu*.

**Source**:
- [Občiansky zákonník § 628 (darovacia zmluva)](https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/1964/40/)
- [Zákon o dani z príjmov č. 595/2003 Z. z.](https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2003/595/)

## 2. DPH stratégia

**Rozhodnutie**: am.bonum **nie je platcom DPH** (overené 2026-04-27 cez
VIES — `SK2121850005` invalid). Faktúra ide **bez DPH** s povinnou
poznámkou.

**Hranica obratu** podľa § 4 zákona č. 222/2004 Z. z. o DPH: 49 790 EUR /
12 po sebe nasledujúcich kalendárnych mesiacov. **Treba sledovať** —
keď donations + iné príjmy s.r.o. prekročia tento limit, povinnosť
registrácie do 30 dní. Pri prekročení sa táto sekcia musí prepísať.

**Reverse charge / OSS** pri B2B EÚ klientoch: nerelevantné kým
nie sme platcom DPH. Po registrácii sa to zmení — vtedy treba
reverse charge mechanism pre B2B EÚ + OSS pre B2C cez 10 000 EUR
ročne cross-border.

**Source**:
- [Zákon č. 222/2004 Z. z. o DPH](https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2004/222/)
- [Finančná správa — registračná povinnosť](https://www.financnasprava.sk/sk/podnikatelia/dane/dan-z-pridanej-hodnoty)

## 3. Faktúra obsah

**Rozhodnutie**: **Stripe Invoicing** generuje faktúru automaticky pri
každej úspešnej transakcii (oneoff aj subscription). Šablóna v Stripe
dashboardi obsahuje:

**Povinné polia per § 74 ZDPH** (zjednodušená faktúra pri sume <100 €
môže vynechať časť polí, ale ideme s plnou variantou):
- **Dodávateľ**: am.bonum s. r. o., Škultétyho 1560/3, 052 01 Spišská Nová
  Ves, IČO: 55 055 290, DIČ: 2121850005, **„Nie sme platcami DPH podľa
  § 4 zákona č. 222/2004 Z. z."**
- **Odberateľ**: meno, adresa, DIČ ak ho zákazník zadá (pre B2B)
- **Dátum dodania, dátum vystavenia, číslo faktúry** (Stripe sequenčné)
- **Položka**: „Podpora rozvoja Internet IQ Test — Jednorazová" / „Mesačná
  X. v poradí (mes. obdobie {date_start}–{date_end})"
- **Suma bez DPH = celková suma** (lebo nie sme platcom)
- **Spôsob platby**: Karta / SEPA / Apple Pay (Stripe doplní)
- **IBAN**: Tatra banka SK04 1100 0000 0029 4313 7087 (informatívne;
  Stripe payout sa rieši automaticky)

**Storage**: Stripe drží faktúru pre `automatic_payment_methods`
subscriptions zdarma. Pre oneoff custom invoice je 0.4 % per faktúru
(min ~0.05 €). Pri 100 oneoff platbách / mesiac to je ~5 € / mes — OK.

**Source**:
- [Stripe Invoicing — EÚ compliance](https://stripe.com/docs/invoicing)
- [§ 74 ZDPH — náležitosti faktúry](https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2004/222/)

## 4. Spotrebiteľská zmluva na diaľku

**Rozhodnutie**: pri *digitálnom obsahu poskytnutom okamžite* (čo je
prípad „podpora projektu") **právo na odstúpenie zaniká**, ak spotrebiteľ
**explicitne súhlasí so začatím poskytovania** a berie na vedomie stratu
práva (§ 7 ods. 6 zákona č. 102/2014 Z. z. o ochrane spotrebiteľa pri
predaji tovaru alebo poskytovaní služieb na základe zmluvy uzavretej na
diaľku).

**UI dôsledok**: pred Stripe Checkout submitom musí byť **povinný
checkbox**:
> „Súhlasím so začatím poskytovania okamžite a beriem na vedomie, že
> stratu práva na odstúpenie od zmluvy podľa § 7 ods. 6 zákona č.
> 102/2014 Z. z."

Bez zaškrtnutia tlačidlo „Pokračovať na Stripe" disabled.

**Subscription cancellation**: zrušenie odberu nie je „odstúpenie od
zmluvy" — je to **plánované ukončenie do nasledujúceho fakturačného
obdobia**. Žiadny refund minulej platby, len neskoršie obdobia sa
nefakturujú.

**Source**:
- [Zákon č. 102/2014 Z. z., § 7 ods. 6](https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2014/102/)

## 5. AML compliance

**Rozhodnutie**: `max_amount_eur_oneoff = 500`. Limit je validovaný:
- klient-side v `/podpora` UI
- server-side v `/api/create-checkout-session` (CF Pages Function)
- webhook double-check (event timestamp <5 min, sum <500)

**Rationale**: zákon č. 297/2008 Z. z. § 10 vyžaduje **základnú
starostlivosť** (KYC) pri nezvyčajných transakciách alebo pri sume
≥1 000 EUR od jednej osoby. Pri donation (spravidla emocionálne
motivované, malé sumy) **držať pod 500 EUR** úplne eliminuje AML
overhead.

**Mesačné odbery**: Stripe generuje samostatné transakcie (5/10/25 €
× 12 mes = 60/120/300 € ročne) — všetky dobre pod 1 000 € hranicou
per pôvodný registrovaný úmysel.

**Pri prekročení**: webhook reject → Stripe automaticky cancel
authorization, žiadne charge. Užívateľ vidí v Stripe Checkout error.

**Source**:
- [Zákon č. 297/2008 Z. z. o ochrane pred legalizáciou príjmov](https://www.slov-lex.sk/pravne-predpisy/SK/ZZ/2008/297/)
- [FIU SR — usmernenia](https://www.minv.sk/?financna-policia)

## 6. GDPR Art. 13 disclosure

**Rozhodnutie**: pred Stripe Checkout musí `/podpora` form viditeľne
zobraziť **„Aké údaje spracujeme"** panel:

> **Aké údaje** *(spracúvateľ: am.bonum s. r. o., kontakt segnities@gmail.com)*:
> - **E-mail** — pre faktúru a budúcu komunikáciu k odberu
> - **Meno alebo názov firmy** — pre faktúru
> - **DIČ** *(voliteľné)* — pre B2B faktúru s odpočtom
> - **Adresa** *(voliteľná)* — vyžadovaná Stripe pri sumách ≥35 €
> - **Kartové údaje** — spracúva Stripe, Inc. (USA, SCC); my ich nikdy nevidíme
>
> **Účel**: vystavenie faktúry, AML compliance, retencia účtovných záznamov
> **Právny základ**: čl. 6 ods. 1 písm. b GDPR (zmluva), písm. c (právna povinnosť pre účtovníctvo)
> **Retencia**: 10 rokov per zákon č. 431/2002 Z. z. o účtovníctve
> **Práva**: prístup, oprava, vymazanie (s obmedzeniami pre účtovné záznamy), prenos, sťažnosť na ÚOOÚ SR

**Privacy stránka** (E10.5) má detailnú sekciu „Sponzorovanie projektu" so
všetkými údajmi vyššie + odkazy na Stripe SCC a Resend SCC.

## 7. Stripe vs. alternatívy

**Rozhodnutie**: **Stripe**. Comparison matrix:

| Kandidát | Pre | Proti | Verdikt |
|---|---|---|---|
| **Stripe** | EÚ-licensed, native SCA, hosted Checkout, recurring API, Customer Portal, Invoicing built-in, Apple/Google Pay | ~1.5 % + 0.25 € per EÚ karta poplatok | ✅ **Vybrané** |
| Revolut Business | Slovenská banka-friendly, lacnejšie poplatky | Slabšie recurring API, menej zrelý dashboard, žiadny Customer Portal | ❌ |
| GoCardless | Direct debit lacný | SEPA-only, žiadne karty/Apple Pay, slabý donor UX | ❌ |
| SumUp | EÚ-friendly | Primárne POS-orientovaný, recurring slabší | ❌ |
| PayPal | Veľmi známy | Vysoké poplatky (3.4 % + 0.35 €), zlé chargeback flow, žiadny native invoicing | ❌ |
| Stripe Climate add-on | Carbon-offset 1 % donation | Nie pre náš prípad (nie sme cli) | ❌ |
| Manuálny IBAN bank transfer | 0 % poplatky | Žiadny SCA, žiadny self-service portál, manuálne reconciliation | ❌ |

**Stripe nastavenie**:
- Payout cadence: **týždenne** (default), payout na IBAN SK04 1100 ...
- Mode: production po MVP launch (test mode počas dev)
- Customer Portal: enabled, locale `sk` (fallback EN)

## 8. Webhook host

**Rozhodnutie**: **Cloudflare Pages Functions** (`functions/api/stripe-webhook.ts`).

**Rationale**:
- Držíme jeden vendor (CF Pages) na celý serverless layer — žiadny ďalší
  service na monitoring
- Native binding na CF env vars (Stripe secret, Supabase service role)
- Edge-native rate limiting (cez `KV` alebo `Durable Objects`)
- 10 sek timeout je dostatočný (Stripe webhook je krátky, idempotentný)

**Alternatíva odmietnutá**: Supabase Edge Functions — Deno-based, separate
deployment pipeline, ďalší vendor. Funkčne ekvivalentné, ale operačne
horšie.

**Bezpečnosť**: Stripe SDK `constructEvent()` overuje signature **a**
timestamp (default tolerance 5 min) — replay protection vstavaná.

## 9. Anonymita mechanizmus

**Rozhodnutie**: **default anonymita ON** (sponsor nezviditeľnený).
Granulárny opt-in:

| Pole v `sponsors` | Význam |
|---|---|
| `display_name TEXT NULL` | NULL = anonymný; non-NULL = zobraziť na `/sponzori` |
| `display_link TEXT NULL` | voliteľný odkaz, https-only validácia |
| `display_message TEXT NULL` | voliteľný text, max 80 znakov |
| `show_in_footer BOOLEAN` | flag pre footer mention pri kvalifikujúcom tier-i |

**Verejný view `public_sponsors`** filtruje `display_name IS NOT NULL` —
anon SELECT cez tento view. Stripe customer (full e-mail, meno, adresa)
zostáva v Stripe-i; my máme len opt-in display fields.

**Footer mention threshold**: oneoff cumulatív ≥50 € **alebo** monthly_eur
≥25 € + `show_in_footer = true`. SQL view `footer_sponsors` aplikuje filter.

## 10. Refund policy

**Rozhodnutie**: **No refunds** ako default. **Cancel anytime** pre
subscriptions cez Stripe Customer Portal (efekt na nasledujúcom
fakturačnom období, nie minulom).

**UI disclosure**: pri checkout text „Refund nepoužívame — môžete však
kedykoľvek zrušiť mesačný odber jediným kliknutím cez váš e-mail."

**Edge cases (manuál cez Stripe dashboard)**:
- Duplicitný charge omylom — full refund manuálne
- Verifikovaný podvod (kradnutá karta) — full refund + Stripe dispute response
- Chargeback / dispute z banky — Stripe automatic, evidence submit cez E11.5 runbook
- Slovenský spotrebiteľský orgán nariadi refund — full refund (ne rátame s tým,
  ale runbook to pokrýva)

**Subscription cancellation**: žiadny refund minulej platby. Užívateľ sa
môže zrušiť kedykoľvek; aktuálne fakturačné obdobie zostáva platné, ďalšie
sa nefakturujú.

## 11. Retencia donor data

**Rozhodnutie**:

| Údaj | Doba | Báza | Po expírácii |
|---|---|---|---|
| `sponsors.stripe_customer_id` | 10 rokov | Účtovníctvo | Anonymizácia (ID stays for audit) |
| `sponsors.display_*` | 10 rokov / kým je opt-in | Marketing consent | NULL pri opt-out kedykoľvek |
| `donations.amount + invoice_pdf_url` | **10 rokov** | § 35 zákona č. 431/2002 Z. z. | Žiadne — povinné |
| `subscriptions.*` | 10 rokov po cancelled_at | Účtovníctvo | Anonymizácia |
| Stripe customer (e-mail, meno, adresa) | Stripe vlastný retention | Stripe processor | Stripe automaticky |

**Coexistence s ostatnou DB**:
- `attempts` má 36-mesačnú retenciu (E1.x)
- `test_sets` má 12-mesačnú retenciu (E8.1)
- `sponsors / donations / subscriptions` má **10-rocnú** — najdlhšia, kvôli
  zákonu o účtovníctve

GDPR Art. 17 (právo byť zabudnutý) **nemôže** prelomiť účtovnú retenciu;
v takom prípade anonymizujeme `display_name = NULL`, ale donations row
zostáva pre audit trail.

## 12. CSP zmena

**Rozhodnutie**: aktualizácia `public/_headers` v rámci E10.4:

```
Content-Security-Policy:
  default-src 'self';
  script-src 'self' 'unsafe-inline' https://js.stripe.com https://checkout.stripe.com;
  connect-src 'self' https://*.supabase.co https://api.stripe.com https://q.stripe.com https://checkout.stripe.com;
  frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://checkout.stripe.com;
  img-src 'self' data: https://*.stripe.com;
  font-src 'self' data:;
  worker-src 'self' blob:;
  form-action 'self' https://checkout.stripe.com;
  frame-ancestors 'none';
  base-uri 'self';
```

**Dôvody** každej zmeny:
- `script-src` += stripe + checkout.stripe — Stripe.js + redirect bridge
- `connect-src` += stripe APIs — Stripe.js fetch volania
- `frame-src` += stripe — 3D Secure challenge iframe
- `img-src` += stripe — Apple/Google Pay logá
- `worker-src 'self' blob:` — Stripe.js používa Web Workers pre fraud
  detection (toto chýbalo v pôvodnom CSP)
- `form-action` += checkout.stripe — Checkout redirect je technicky `<form>` POST

---

## Open items pred go-live

1. **Stripe účet registrovaný a verified** — 1–3 dni pre s.r.o. verifikáciu
   (Stripe overuje IČO, IBAN, OP konateľa). Bez toho sa dá vyvíjať len
   v test mode.
2. **DKIM/SPF/DMARC pre lvtesting.eu** — pre Resend transakčné emaily
   (E11.8). Nutné pred prvým živým magic linkom.
3. **Live webhook secret** — vygenerovať v Stripe dashboardi, pridať do
   CF Pages env vars ako `STRIPE_WEBHOOK_SECRET`.
4. **Test mode end-to-end** — 1× oneoff 5 €, 1× subscription 5 €/mes,
   1× cancel cez Customer Portal, 1× refund manuálne. Všetky cez Stripe
   test cards (4242 4242 4242 4242).
5. **Privacy stránka updated** (E10.5) pred prvou živou transakciou —
   inak GDPR Art. 13 porušenie.
6. **Účtovník informovaný** — upozornenie že nový príjmový zdroj „podpora
   rozvoja" je v účtovníctve. Faktúry zo Stripe sa stahujú raz mesačne
   ako CSV bulk.

---

## Sign-off

- [ ] Product owner: **Lubomír Volčko** *(pending)*
- [ ] Voliteľne externý účtovník — odporúčané pred prvou živou transakciou
- [ ] Voliteľne advokát — len ak PO chce nezávislú legal review

Po sign-off sa môžu začať E10.2, E10.3, E10.4, E10.5, E11.1+ stories.

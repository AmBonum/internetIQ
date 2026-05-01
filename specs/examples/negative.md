# Edu intake form validation — negative-focused test plan (EXAMPLE)

**Area:** `specs/examples/`
**Component(s) under test:** `src/components/composer/edu/intake/RespondentIntakeForm.tsx`, `functions/api/begin-edu-attempt.ts`
**Routes:** `/test/zostava/$id` (s `collects_responses=true`)
**API endpoints:** `POST /api/begin-edu-attempt`
**Data dependencies:** `test_sets` (existujúci edu set s `collects_responses=true`), `attempts` (RLS „Anon insert non-edu attempts only" blokuje anon edu INSERT)
**Last updated:** 2026-05-01

---

## Context

**Referenčný plán pre planner — soustredí sa na negative scenarios.** Edu intake form (E12.3 + E12.7) musí odolať bežným chybám, bot abuse a server zlyhaniam. Plán nepokrýva happy path detailne (ten je v `specs/edu/intake-form.md`) — ukazuje, ako sa píše plán, kde je **jadro hodnoty v negative + edge cases**.

## Out of scope

- Tvorba edu test setu autorom — pokrýva `specs/composer/edu-toggle.md`.
- Author results dashboard — pokrýva `specs/edu/results-dashboard.md`.
- JWT verifikácia v `/api/finish-edu-attempt` — pokrýva `specs/edu/finish-attempt.md`.

---

## Happy paths

### TC-01: Validný intake → JWT vydaný → test sa spustí

**Prerequisites**:
- Edu test set existuje, `collects_responses=true`.
- Browser na `/test/zostava/<setId>`.
- Žiadny záznam pre `(set_id, jana@skola.sk)` v `attempts`.

**When** vyplníš pole „Meno a priezvisko" hodnotou `Jana Nováková`
**and** vyplníš pole „E-mail" hodnotou `jana@skola.sk`
**and** zaškrtneš GDPR consent checkbox
**and** klikneš „Pokračovať na test →"
**Then** POST `/api/begin-edu-attempt` vráti HTTP 200 s validným JWT
**and** intake formulár zmizne a zobrazí sa prvá otázka testu

---

## Negative scenarios

### TC-02: Submit bez vyplneného mena

**Prerequisites**:
- Otvorený `/test/zostava/<setId>` s edu intake formom.

**When** vyplníš e-mail `jana@skola.sk`
**and** zaškrtneš GDPR consent
**and** klikneš „Pokračovať na test →" so prázdnym poľom „Meno"
**Then** tlačidlo zostáva disabled (klient-side gate)
**and** žiadny POST na `/api/begin-edu-attempt` sa neodošle

### TC-03: Server odmietne neplatný formát e-mailu

**Prerequisites**:
- Klient-side validácia obídená cez `evaluate` (priama `fetch` na endpoint).

**When** odošleš POST `/api/begin-edu-attempt` s `email: "not-an-email"`
**Then** server vráti HTTP 400 s body `{"error":"invalid_email"}`
**and** žiadny záznam v `attempts` nepribudne

### TC-04: Príliš krátke meno — 1 znak

**Prerequisites**:
- Otvorený intake form.

**When** vyplníš pole „Meno" hodnotou `X` (1 znak)
**and** vyplníš e-mail a consent korektne
**and** odošleš formulár cez `evaluate` (klientskú validáciu obídeš)
**Then** server vráti HTTP 400 s `{"error":"name_length"}`
**and** UI zobrazí slovenskú hlášku „Meno musí mať aspoň 2 a najviac 80 znakov."

### TC-05: Príliš dlhé meno — 81 znakov

**Prerequisites**:
- Otvorený intake form.

**When** vyplníš pole „Meno" 81 znakmi (`'x'.repeat(81)`)
**and** odošleš formulár
**Then** input field má `maxLength=80` atribút (HTML obmedzí na 80)
**and** keď bypass cez evaluate, server vráti `name_length` 400

### TC-06: Submit bez GDPR consentu

**Prerequisites**:
- Vyplnené meno + email, ale GDPR checkbox NEZAŠKRTNUTÝ.

**When** klikneš na submit tlačidlo
**Then** tlačidlo zostáva disabled (consent je povinný klient-side)
**and** keď klient bypass-neš a odošleš `consent: false`, server vráti `invalid_shape` 400

### TC-07: Test set neexistuje

**Prerequisites**:
- Random UUID `00000000-0000-0000-0000-000000000000` ktorý nie je v DB.

**When** odošleš POST s týmto `set_id` a inak validnými dátami
**Then** server vráti HTTP 404 s `{"error":"set_not_found"}`
**and** UI zobrazí hlášku „Tento test už neexistuje. Pýtaj sa autora na nový odkaz."

### TC-08: Test set existuje ale collects_responses=false

**Prerequisites**:
- Existujúci NON-edu test set v DB.

**When** odošleš POST s týmto set_id
**Then** server vráti HTTP 400 s `{"error":"not_edu_set"}`
**and** UI zobrazí „Tento test nezbiera odpovede s menom — preto sem prístup nepotrebuješ."

### TC-09: Duplicitný respondent — rovnaký e-mail pre rovnaký set

**Prerequisites**:
- V `attempts` existuje riadok s `(set_id=X, respondent_email='jana@skola.sk')`.

**When** odošleš POST s rovnakým `set_id` a `email: "jana@skola.sk"` (lower-case match)
**Then** server vráti HTTP 409 s `{"error":"already_attempted"}`
**and** UI zobrazí „Tento test si už pod týmto e-mailom absolvoval/a. Pre opakovanie kontaktuj autora."

---

## Edge cases

### TC-10: Honeypot field non-empty (bot detection)

**Prerequisites**:
- Otvorený intake form.

**When** cez `evaluate` nastavíš `hidden input[name="hp_url"]` na `http://spam.example/`
**and** odošleš formulár inak validne
**Then** server vráti HTTP 400 s `{"error":"spam_detected"}`
**and** v server console je `console.warn("begin-edu-attempt honeypot tripped", ...)` log
**and** žiadny JWT sa nevydá

### TC-11: Rate limit per IP — 4. pokus v rámci 5 minút

**Prerequisites**:
- Cez to isté `cf-connecting-ip` (mocked) bolo odoslaných 3 POST volaní s rôznymi e-mailami.

**When** odošleš 4. POST s ďalším valídnym e-mailom
**Then** server vráti HTTP 429 s `{"error":"rate_limited"}`
**and** UI zobrazí „Príliš veľa pokusov v krátkom čase. Skús znova o pár minút."

### TC-12: E-mail s veľkými písmenami sa zlučí (case-insensitive dedupe)

**Prerequisites**:
- V `attempts` existuje riadok s `respondent_email='jana@skola.sk'` (lower-case).

**When** odošleš POST s `email: "JANA@SKOLA.SK"` (rovnaký e-mail, iné case)
**Then** server normalizuje na lower-case pred dup check
**and** vráti HTTP 409 `already_attempted` (nie 200 — INSERT by inak vytvoril 2 riadky)

### TC-13: E-mail s leading/trailing whitespace

**Prerequisites**:
- Otvorený intake form.

**When** vyplníš e-mail hodnotou `"  jana@skola.sk  "` (s medzerami)
**and** odošleš formulár
**Then** server `.trim()` whitespace pred validáciou
**and** vráti 200 OK (alebo `already_attempted` ak duplicitný), nie `invalid_email`

### TC-14: Slovenské diakritiky v mene

**Prerequisites**:
- Otvorený intake form.

**When** vyplníš pole „Meno" hodnotou `Žofia Ščúrová-Ďurišová`
**and** odošleš formulár
**Then** JWT v claim `name` obsahuje plný UTF-8 string vrátane diakritík
**and** v `attempts.respondent_name` (po finish-edu-attempt) je presne tá istá hodnota

### TC-15: XSS pokus v mene

**Prerequisites**:
- Otvorený intake form.

**When** vyplníš pole „Meno" hodnotou `<script>alert('xss')</script>`
**and** dokončíš celý flow vrátane testu
**and** autor otvorí results dashboard
**Then** v dashboarde sa string zobrazí ako plain text (React auto-escape)
**and** žiadny `alert` dialog sa nevyvolá
**and** v CSV exporte je hodnota wrappovaná do `"..."` per RFC 4180

### TC-16: Network offline počas submitu

**Prerequisites**:
- Vyplnený valídny formulár.
- Playwright `context.setOffline(true)` aktivované pred kliknutím submit.

**When** klikneš „Pokračovať na test →"
**Then** UI po ~5 sekundách zobrazí „Pripojenie sa nepodarilo. Skontroluj sieť a skús znova."
**and** tlačidlo sa znovu povolí pre opakovanie
**and** po `setOffline(false)` a opätovnom kliku flow uspeje

### TC-17: Submit počas in-flight (double-click)

**Prerequisites**:
- Server response je oneskorený o 2 s (`route` mock).

**When** klikneš „Pokračovať na test →"
**and** klikneš ho znovu do 100 ms
**Then** druhý klik je ignorovaný (state `submitting` zablokuje opakované volanie)
**and** odošle sa presne 1 POST request

### TC-18: Browser back po úspešnom intake

**Prerequisites**:
- Intake úspešný, test prebieha (otázka 3/15).

**When** stlačíš browser back tlačidlo
**Then** vráti ťa na intake form ALEBO zobrazí potvrdzovací dialóg pred opustením
**and** ak sa vrátiš dopredu, JWT v memory je stále valídny (token nestratený)

### TC-19: Klávesnicový flow (a11y)

**Prerequisites**:
- Otvorený intake form, fokus na prvom inpute.

**When** prejdeš formulárom iba klávesnicou (Tab cez všetky polia, Space na checkbox, Enter na submit)
**Then** všetky inputy sú dosiahnuteľné Tab-om v logickom poradí
**and** GDPR consent label aktivuje checkbox cez Space (nie potrebujeme klikať)
**and** screen reader (axe-core check) nehlási žiadne porušenia WCAG AA

---

## Open questions

- Akú hlášku UI zobrazí pri `set_not_found` ak set existoval ale bol auto-mazaný (12-mes retencia `purge_unused_test_sets`)? — _aktuálne to isté ako manuálne neexistujúci, ale možno chceme nuancovať._

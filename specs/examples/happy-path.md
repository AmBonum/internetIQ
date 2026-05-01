# Anonymous quiz — happy-path test plan (EXAMPLE)

**Area:** `specs/examples/`
**Component(s) under test:** `src/routes/test.index.tsx`, `src/components/quiz/flow/TestFlow.tsx`, `src/components/quiz/results/ResultsView.tsx`
**Routes:** `/test`, `/r/$shareId`
**API endpoints:** _None — anon Supabase INSERT cez `@/integrations/supabase/client`._
**Data dependencies:** `attempts` tabuľka (RLS politika "Anon insert non-edu attempts only" povoľuje INSERT keď `respondent_name IS NULL`)
**Last updated:** 2026-05-01

---

## Context

Toto je **referenčný plán** pre planner agenta. Pokrýva najjednoduchší flow: anonymný používateľ otvorí `/test`, klikne „Spustiť", odpovie na 15 otázok, vidí výsledok a klikne na zdieľací odkaz. Žiadne meno, žiadny e-mail, žiadne heslo. Plán slúži ako vzor štruktúry — tone, granularity a Prerequisites/When/and/Then formátu.

## Out of scope

- Scoring algoritmus (overený unit testami v `tests/lib/quiz/`).
- Trap dialóg (samostatný plán `specs/quiz/trap-dialog.md`).
- Survey karta po teste (samostatný plán `specs/quiz/post-test-survey.md`).

---

## Happy paths

### TC-01: Spustiť test, odpovedať na všetky otázky a vidieť skóre

**Prerequisites**:
- Browser na `http://localhost:8080/`.
- Žiadny cookie banner consent zatiaľ neuložený (čistý localStorage).
- Vite a Wrangler bežia (`npm run dev` + `npm run dev:api`).
- Viewport 1280×800.

**When** klikneš na primárne CTA „Spustiť test" na hero sekcii
**and** prijmeš nutné cookies kliknutím „Prijať všetko" v banneri
**and** odpovieš správne na všetkých 15 otázok kliknutím na prvú možnosť, ktorá sa javí ako legit
**Then** stránka prejde na výsledkovú obrazovku s nadpisom obsahujúcim slovo „skóre"
**and** zobrazí sa percentilová hodnota v rozsahu 0–100
**and** zobrazí sa archetyp osobnosti (jeden z piatich slovenských názvov definovaných v `src/lib/quiz/score/scoring.ts`)
**and** v `attempts` tabuľke pribudol presne 1 nový riadok kde `respondent_name IS NULL`

### TC-02: Zdieľací odkaz vedie späť na moje výsledky

**Prerequisites**:
- TC-01 prebehol — share_id je viditeľné na výsledkovej stránke.

**When** klikneš na tlačidlo „Skopírovať odkaz"
**and** otvoríš skopírovaný URL v incognito okne
**Then** stránka `/r/$shareId` zobrazí rovnaké skóre ako pôvodná session
**and** zobrazí review odpovedí keď klikneš „Pozrieť detailný rozbor"

---

## Negative scenarios

### TC-03: Vyhodené prerušenie testu po 5. otázke ho nezruší úplne

**Prerequisites**:
- Test je v progrese, odpovedaných 5/15 otázok.

**When** zatvoríš tab
**and** otvoríš znova `/test`
**Then** stránka ponúkne pokračovať od 6. otázky cez sessionStorage state
**and** progres bar ukazuje 5/15 splnených

### TC-04: Submit zlyhá pri 500 z Supabase

**Prerequisites**:
- Playwright `route` mock na `*/rest/v1/attempts` vracia 500.

**When** dokončíš všetkých 15 otázok
**Then** výsledková stránka zobrazí skóre lokálne (z client-side scoring)
**and** zobrazí sa neutrálna chybová hláška „Výsledok sa nepodarilo uložiť, ale tvoje skóre vidíš tu"
**and** žiadny share_id sa nevygeneruje
**and** v console nie je žiadne PII v error logu

---

## Edge cases

### TC-05: Test absolvovaný za < 1 sekundu (anti-cheat)

**Prerequisites**:
- Headless mode, klik scripted čo najrýchlejšie.

**When** klikneš na všetky odpovede do 1 sekundy od spustenia
**Then** výsledková stránka zobrazí skóre 0 alebo flag „cheat detected"
**and** v `attempts.flags` pribudne hodnota `"too_fast"`

### TC-06: Test absolvovaný za > 1 hodinu

**Prerequisites**:
- Browser čas posunutý späť o 60 min cez `clock` API.

**When** odošleš odpoveď po 60+ minútach od štartu
**Then** server odmietne INSERT cez constraint `attempts_time_nonneg` (max 3 600 000 ms)
**and** klientovi sa zobrazí „Test trval príliš dlho, skús odznova"

### TC-07: Slovenské diakritiky v nickname po teste

**Prerequisites**:
- Survey karta zobrazená po dokončení testu.

**When** vyplníš pole „Prezývka" hodnotou `Žofia Ščúrová-Ďurišová`
**and** klikneš „Uložiť"
**Then** UPDATE attempts uspeje (RLS demographics-only policy)
**and** pri reload `/r/$shareId` sa diakritiky zobrazia korektne

### TC-08: Refresh strednou stránkou nezdvojí INSERT

**Prerequisites**:
- Si na poslednej (15.) otázke.

**When** klikneš na poslednú odpoveď
**and** okamžite stlačíš F5 pred tým, ako server vráti odpoveď
**Then** v `attempts` tabuľke pribudol presne 1 riadok, nie 2
**and** výsledková stránka po reloade zobrazí to isté skóre

### TC-09: localStorage je vypnutý (privacy mód)

**Prerequisites**:
- Browser context s `storageState: { localStorage: [] }` a Playwright permissions blokujúce storage.

**When** klikneš „Spustiť test"
**Then** test sa spustí (state v memory, nie persistuje)
**and** po refreshe sa stratí progres a zobrazí sa „Pokračovať od začiatku"
**and** žiadny console error neunikne (graceful degradation)

### TC-10: Mobilný viewport — všetky CTA tlačidlá viditeľné bez horizontal scroll

**Prerequisites**:
- Viewport 375×667 (iPhone SE).

**When** prejdeš celým testom v mobilnom móde
**Then** „Pokračovať" tlačidlo je vždy v rámci viewportu
**and** žiadny prvok nepretvára `document.body` na width > 375

---

## Open questions

- Existuje konkrétny rate-limit na anon `attempts` INSERT? (Aktuálne závislé len na CF Pages-level limite.) — _zatiaľ otvorené, ovplyvní TC k abuse rate-limit-u._

# Edu password gate — edge-case-heavy test plan (EXAMPLE)

**Area:** `specs/examples/`
**Component(s) under test:** `src/components/composer/edu/dashboard/AuthorPasswordGate.tsx`, `functions/api/verify-author-password.ts`, RPC `verify_test_set_password`
**Routes:** `/test/zostava/$id/vysledky`
**API endpoints:** `POST /api/verify-author-password`, `DELETE /api/verify-author-password`
**Data dependencies:** `test_sets.author_password_hash` (bcrypt cez `pgcrypto`), HttpOnly cookie `subenai_edu_author`, JWT claims `{set_id, role:"author"}` signed s `JWT_SECRET`
**Last updated:** 2026-05-01

---

## Context

**Referenčný plán pre planner — demonštruje, ako sa píše plán s ťažiskom na edge cases.** Author password gate je bezpečnostne najcitlivejší endpoint v edu mode (chráni PII celej triedy). Plán cieli na **hraničné situácie a útoky**, lebo happy path má len 1 zaujímavý prípad.

## Out of scope

- Zobrazenie agregátov a per-respondent tabuľky po prihlásení — pokrýva `specs/edu/results-dashboard.md`.
- CSV export logika — pokrýva `specs/edu/csv-export.md`.
- DELETE respondenta z dashboardu — pokrýva `specs/edu/delete-respondent.md`.

---

## Happy paths

### TC-01: Správne heslo otvorí dashboard

**Prerequisites**:
- Edu test set existuje s heslom `Tajne123!@#`.
- Browser na `/test/zostava/<setId>/vysledky` (no cookie).

**When** zadáš heslo `Tajne123!@#`
**and** klikneš „Otvoriť výsledky →"
**Then** server vráti HTTP 200 + `Set-Cookie: subenai_edu_author=<JWT>; HttpOnly; Secure; SameSite=Lax; Path=/test/zostava/<setId>; Max-Age=3600`
**and** stránka prejde do dashboard view (gate zmizne)
**and** zobrazí sa tabuľka respondentov

---

## Negative scenarios

### TC-02: Nesprávne heslo

**Prerequisites**:
- Edu test set s heslom `Tajne123!@#`.

**When** zadáš heslo `iné-heslo`
**and** klikneš „Otvoriť výsledky →"
**Then** server vráti HTTP 401 s `{"error":"unauthorized"}`
**and** žiadny `Set-Cookie` header v odpovedi
**and** UI zobrazí „Nesprávne heslo, alebo sa zostava nenašla."

### TC-03: Prázdne heslo

**Prerequisites**:
- Otvorený gate.

**When** klikneš submit so prázdnym poľom
**Then** tlačidlo je disabled (klient-side gate)
**and** žiadny POST sa neodošle

---

## Edge cases

### TC-04: Brute-force — 6. pokus z toho istého IP

**Prerequisites**:
- 5 nesprávnych pokusov v rámci posledných 15 min z `cf-connecting-ip=198.51.100.30` (mocked).

**When** odošleš 6. pokus s ľubovoľným heslom (aj správnym)
**Then** server vráti HTTP 429 `{"error":"rate_limited"}` ešte pred volaním RPC
**and** UI zobrazí „Príliš veľa pokusov. Skús to znova o 15 minút."
**and** ani správne heslo neotvorí dashboard počas trvania penalty window

### TC-05: Brute-force — distribútovaný útok cez 10 IP adries

**Prerequisites**:
- 10 rôznych IP, každá vykonala 5 pokusov za posledných 15 min.

**When** 11. IP odošle 1. pokus s nesprávnym heslom
**Then** server vráti 401 `unauthorized` (nie 429 — táto IP má svoju kvótu)
**and** poznámka: rate limit je **per-(IP,set)** — útočník s IP-rotation môže obísť cap
**and** _open question (viď nižšie): potrebujeme aj per-set globálny cap?_

### TC-06: Heslo s leading/trailing whitespace

**Prerequisites**:
- Edu set s heslom `Tajne123` (bez medzier).

**When** zadáš `  Tajne123  ` (s medzerami)
**Then** server NE-trim-uje heslo pred bcrypt comparison
**and** vráti 401 (rovnaké heslo s medzerami != bez medzier — bcrypt je byte-exact)
**and** _alternatívne, ak v UI máš `.trim()` na input, dokumentuj to v plane_

### TC-07: Heslo dlhé 200 znakov

**Prerequisites**:
- Edu set s heslom `Tajne123` (8 znakov, bcrypt prefix nie je problém).

**When** zadáš heslo dlhé 200 znakov
**Then** bcrypt internally truncate na 72 byty, ale comparison je správny (`Tajne123` != truncated 200-char)
**and** server vráti 401
**and** žiadne crash / timeout — bcrypt je rýchly aj na 200 znakov

### TC-08: Cookie tampering — pozmenený JWT payload

**Prerequisites**:
- Klient má valídny `subenai_edu_author` cookie pre `set-A`.

**When** v devtools editneš cookie value, nahradíš base64 payload pre `set-B`
**and** otvoríš `/test/zostava/<set-A>/vysledky`
**Then** server overí JWT signature → nesedí (HMAC verify fail)
**and** vráti HTTP 401 `{"error":"token_bad_signature"}`
**and** dashboard sa nezobrazí

### TC-09: Cookie z iného setu (set_mismatch)

**Prerequisites**:
- Valídna session cookie pre `set-A`.

**When** ručne navštíviš `/test/zostava/<set-B>/vysledky`
**Then** browser pošle cookie pre `set-B` len ak Path scope match (čo NIE je — Path je `/test/zostava/set-A`)
**and** server vidí no-cookie a vráti `no_session` 401
**and** zobrazí sa password gate pre `set-B`

### TC-10: Respondent JWT skúsi otvoriť dashboard

**Prerequisites**:
- Klient má valídny respondent attempt JWT (z `/api/begin-edu-attempt`) v custom cookie.

**When** ručne nastavíš `subenai_edu_author=<respondent-JWT>`
**and** voláš `POST /api/results-data`
**Then** `verifyEduAuthorToken` overí signature OK, ale claim `role !== "author"`
**and** server vráti HTTP 401 `{"error":"token_wrong_role"}`
**and** dashboard sa nezobrazí

### TC-11: Cookie expired (TTL 60 min)

**Prerequisites**:
- Valídna author session cookie vydaná pred 61 min (clock posunutý).

**When** voláš `POST /api/results-data`
**Then** JWT verifikácia vráti `{ok: false, reason: "expired"}`
**and** server vráti HTTP 401 `{"error":"token_expired"}`
**and** UI prejde späť na password gate

### TC-12: Logout DELETE vyčistí cookie

**Prerequisites**:
- Aktívna session.

**When** klikneš „Odhlásiť"
**Then** browser pošle `DELETE /api/verify-author-password` s `set_id` v body
**and** server vráti HTTP 200 + `Set-Cookie: subenai_edu_author=; Max-Age=0; Path=/test/zostava/<setId>`
**and** browser cookie pre tento Path zmizne
**and** ďalší pokus o `/results-data` vráti `no_session`

### TC-13: Logout pre iný set ako aktuálny

**Prerequisites**:
- Cookie pre `set-A` aktívna.

**When** odošleš `DELETE /api/verify-author-password` s `set_id: "set-B"` v body
**Then** server vystaví Max-Age=0 cookie pre Path `/test/zostava/set-B`
**and** cookie pre `set-A` zostáva netknutá (Path scope-ovaná samostatne)

### TC-14: 50 paralelných pokusov o login z 50 tabov

**Prerequisites**:
- 50 tabov otvorených na rovnakom URL, všetky s rovnakým správnym heslom.

**When** všetky 50 tabov odošlú submit naraz
**Then** prvých 5 prejde 401/200 (rate limit allows 5 / 15 min)
**and** zvyšných 45 dostane 429 `rate_limited`
**and** žiadny crash, žiadny memory leak na server side

### TC-15: Server zlyhá — Supabase RPC vráti error

**Prerequisites**:
- Mock `verify_test_set_password` RPC vracia 500 timeout.

**When** odošleš submit s ľubovoľným heslom
**Then** server vráti HTTP 500 `{"error":"rpc_failed"}`
**and** UI zobrazí „Chyba pri overovaní hesla. Skús to prosím znova."
**and** žiadne pokusov sa nepripočíta do rate-limit countera (penalize success/failure, not server error)

### TC-16: JWT_SECRET secret rotation počas aktívnej session

**Prerequisites**:
- Cookie vydaná s old secret.
- CF Pages env var `JWT_SECRET` zmenený na new secret pred 1 min.

**When** voláš `POST /api/results-data`
**Then** verifikácia s new secret zlyhá → `bad_signature`
**and** server vráti 401, UI prejde na password gate
**and** _operational note: rotácia secret-u znamená force re-login pre všetkých autorov — zdokumentuj v ops runbook-u_

### TC-17: Show/hide password toggle

**Prerequisites**:
- Otvorený password gate.

**When** zadáš heslo `Tajne123`
**and** klikneš tlačidlo „Zobraziť"
**Then** input type sa zmení z `password` na `text`
**and** heslo je viditeľné v plain text-e
**and** klik „Skryť" vráti späť na `password` type
**and** keď klik počas typing-u, focus zostáva v inpute (žiadne flicker)

### TC-18: Klávesnicový flow (a11y)

**Prerequisites**:
- Password gate s focus na prvom prvku.

**When** prejdeš formulárom iba klávesnicou (Tab → input, Space na show/hide, Enter na submit)
**Then** všetky prvky sú dosiahnuteľné Tab-om
**and** Enter v password input-e odošle formulár (default form behaviour)
**and** screen reader (axe-core) nehlási žiadne WCAG AA porušenia

### TC-19: Browser autofill (password manager)

**Prerequisites**:
- Password manager s uloženým heslom pre subenai.sk.

**When** otvoríš password gate
**Then** browser auto-fill vyplní pole (input má `autocomplete="current-password"`)
**and** submit s autofill-nutým heslom funguje rovnako ako manuálny vstup

### TC-20: Slovenské diakritiky v hesle

**Prerequisites**:
- Edu set s heslom `Žofiine-heslo123!`.

**When** zadáš presne `Žofiine-heslo123!` (s `Ž` a `í`)
**Then** UTF-8 encoding cez WebCrypto / fetch je preserve-uté
**and** bcrypt comparison na server side uspeje
**and** dashboard sa otvorí

### TC-21: Stripe Customer Portal cookie nie je zameniteľný

**Prerequisites**:
- Klient má valídny `__Host-stripe-portal-session` cookie zo `/spravovat-podporu`.

**When** ručne premenuješ cookie na `subenai_edu_author` a navštíviš `/test/zostava/<setId>/vysledky`
**Then** server skúsi parse JWT → fail (Stripe cookie format != HS256)
**and** vráti `token_malformed` 401
**and** žiadne side effecty z Stripe cookie sa neaplikujú

---

## Open questions

- **Per-set globálny rate-limit cap** (poriešený TC-05) — chceme to pridať proti distribuovanému útoku? Cost-benefit analýza pred E12 v2.
- **Trim password v UI?** Aktuálne kód ne-trim-uje (TC-06). Užívateľská prívetivosť vs bezpečnosť (heslo s medzerami zámerné?).
- **Cookie SameSite=Strict** namiesto `Lax` po stabilizácii flow — bráni cross-site `<a>` linkom otvárať dashboard so session, ale možno zlomí legitímne use-case (napr. e-mail link do GMailu).

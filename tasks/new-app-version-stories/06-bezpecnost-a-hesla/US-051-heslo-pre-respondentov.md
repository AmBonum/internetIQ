# US-051 – Autor nastavuje heslo pre prístup respondentov k testu

| Atribút  | Hodnota                            |
|----------|------------------------------------|
| **ID**   | US-051                             |
| **Priorita** | P0                             |
| **Stav** | Draft                              |
| **Feature** | Bezpečnosť a heslá              |
| **Rola** | Autor / administrátor testu        |

---

## User Story

> Ako **autor testu**
> chcem **nastaviť heslo, ktoré musia respondenti zadať pred vstupom do testu**
> aby som **obmedzil prístup k testu iba na osoby, ktorým som link a heslo oprávnene poskytol**.

---

## Kontext

Heslo pre respondentov funguje ako kontrolný mechanizmus prístupu k testu.
Je oddelené od admin hesla. Pokiaľ autor heslo nenastaví (nechá prázdne), test
je verejne prístupný pre každého s linkom. Heslo sa overuje server-side.

---

## Akceptačné kritériá

- [ ] **AC-1:** Pole pre respondentské heslo je voliteľné – bez hesla je test dostupný komukoľvek s linkom.
- [ ] **AC-2:** Ak autor nastaví heslo, musí splniť silnostnou politiku (US-052); strength meter je zobrazený.
- [ ] **AC-3:** Systém jasne informuje: „Bez hesla bude test dostupný iba s odkazom. S heslom bude potrebovať zadať heslo pri každom prístupe."
- [ ] **AC-4:** Respondentské heslo sa overuje výhradne na serveri; nikdy nie je uložené v URL ani odoslané v response body.
- [ ] **AC-5:** Po 10 neúspešných pokusoch o zadanie hesla v okne 30 minút sa prístup z danej session dočasne zablokuje na 30 minút (rate limiting na respondentskej strane).
- [ ] **AC-6:** Autor môže respondentské heslo kedykoľvek zmeniť v admin dashboarde (bez nutnosti prechodu do draft stavu); existujúce aktívne sessions respondentov sú invalidované po zmene hesla (alebo po 30 minútach – konfigurovateľné).
- [ ] **AC-7:** Respondentské heslo sa zobrazuje v admin summary stránke (US-061) zakryté (masked) s možnosťou odkrytia.
- [ ] **AC-8:** Heslo pre respondentov nesmie byť zhodné s admin heslom; systém to pri nastavení overí.

---

## Technické poznámky

- Uloženie: rovnaký hash algoritmus ako admin heslo (argon2id alebo bcrypt ≥ 12).
- Rate limiting: implementovať na úrovni Edge middleware (Cloudflare), nie len aplikačnej vrstve.
- Session invalidácia po zmene hesla: vymazať aktívne respondentské session tokeny z `respondent_sessions` tabuľky.
- Ak je heslo `NULL` (nevyplnené), test je verejný – API handler to musí explicitne branchovat.

---

## Edge Cases

- Respondent zadá heslo s diakritikou alebo emoji: systém musí hash-ovať normalizovanú UTF-8 hodnotu.
- Autor nastaví prázdne heslo po predchádzajúcom non-empty hesle: systém sa opýta na potvrdenie „Naozaj chcete odstrániť ochranu heslom?".
- Respondent otvorí link v inkognito mode a chybne zadá heslo 10-krát: IP-based rate limiting musí fungovať aj pre inkognito.

---

## Závislosti

- Závisí na: US-052 (politika síly hesla), US-053 (bezpečné ukladanie)
- Blokuje: US-071 (vstup respondenta), US-002 (respondent flow)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: rate limiting logika, hash verifikácia
- [ ] Integračné testy: zmena hesla → invalidácia sessions
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Security review: rate limiting funguje na Edge úrovni

# US-071 – Respondent zadá heslo a vstúpi do testu

| Atribút  | Hodnota                            |
|----------|------------------------------------|
| **ID**   | US-071                             |
| **Priorita** | P0                             |
| **Stav** | Draft                              |
| **Feature** | Custom link – vstup respondenta |
| **Rola** | Respondent                         |

---

## User Story

> Ako **respondent**
> chcem **zadať heslo k chránenému testu a po jeho overení plynulo pokračovať do testu**
> aby som **mohol bezpečne vyplniť test, ku ktorému mi autor poskytol prístupové heslo**.

---

## Kontext

Ak autor nastavil respondentské heslo (US-051), tento krok je povinný. Heslo overenie
prebieha server-side. Respondent nesmie vidieť žiadne technické detaily o dôvode
zamietnutia (bezpečnosť – neskúšaj enumovať).

---

## Akceptačné kritériá

- [ ] **AC-1:** Heslo-pole sa zobrazí po kliknutí na „Začať" na landing stránke (US-070) ak test vyžaduje heslo; nie pred kliknutím.
- [ ] **AC-2:** Pole zobrazuje generickú správu: „Tento test je chránený heslom. Zadajte prístupové heslo." – bez indikácie, aké heslo je správne.
- [ ] **AC-3:** Po zadaní správneho hesla systém:
  - vygeneruje respondentský session token (signed cookie, TTL 4 hodiny)
  - presmeruje respondenta na prvý krok intake formulára (US-040) alebo priamo na test
- [ ] **AC-4:** Po nesprávnom hesle systém zobrazí generickú správu „Zadané heslo je nesprávne" bez indikácie, o koľko pokusov zostáva.
- [ ] **AC-5:** Rate limiting: po **5 neúspešných pokusoch** v rámci 15 minút systém zablokuje prístup z danej session na 30 minút; zobrazí správu s číslom hodín.
- [ ] **AC-6:** Rate limiting je implementovaný na Edge úrovni (Cloudflare Middleware) – nie len v aplikačnej logike.
- [ ] **AC-7:** Heslo pole má `autocomplete="off"` a `type="password"` aby prehliadač neponúkal autofill z history.
- [ ] **AC-8:** Po úspešnom zadaní hesla nie je heslo ďalej uchovávané v pamäti klienta ani session storage.

---

## Technické poznámky

- Server endpoint: `POST /api/t/{shareId}/verify-password` → returns signed session JWT.
- Constant-time compare: rovnaká implementácia ako US-053 (timingSafeEqual).
- Session cookie: `httpOnly: true, secure: true, sameSite: 'Lax'`, expirácia 4h.
- Rate limiting state: Cloudflare KV alebo Durable Object per `shareId + IP hash`.
- Blokovaný respondent (rate limit): zobraziť countdown timer do odblokovania.

---

## Edge Cases

- Test nemá nastavené heslo: krok je preskočený, systém priamo vytvorí session token po kliknutí „Začať".
- Respondent zadá heslo s leading/trailing spaces: trim pred porovnaním.
- Rate limit dosiahnutý na zdieľanej IP (firemné NAT): varovanie pre legitímnych respondentov – nie je elegantnéní riešenie v P0; v P2 pridáme session-based count.

---

## Závislosti

- Závisí na: US-051 (respondentské heslo), US-070 (landing stránka)
- Blokuje: US-080 (spustenie testu)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: rate limiting, constant-time compare, session token generovanie
- [ ] E2E test: správne heslo → session → start; nesprávne 5× → rate limit
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Security review: žiadne heslo v logoch ani session

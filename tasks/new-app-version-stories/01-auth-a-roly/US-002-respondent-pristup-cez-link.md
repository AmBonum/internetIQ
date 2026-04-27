# US-002 – Respondent pristupuje k testu cez custom link

| Atribút  | Hodnota                              |
|----------|--------------------------------------|
| **ID**   | US-002                               |
| **Priorita** | P0                               |
| **Stav** | Draft                                |
| **Feature** | Autentifikácia a roly             |
| **Rola** | Respondent                           |

---

## User Story

> Ako **respondent**
> chcem **otvoriť odkaz na test, prečítať si informácie o ňom a bezpečne do neho vstúpiť**
> aby som **vedel, čo ma čaká a aký je účel testovania skôr, ako začnem vyplňovať**.

---

## Kontext

Respondent nemá vytvorený používateľský účet. Prístup k testu získa výhradne
cez unikátny custom link (US-060), ktorý mu poskytne autor. Ak test vyžaduje
heslo (US-051), respondent ho zadá pred spustením. Celý flow musí byť
jednoduchý, transparentný a GDPR-konformný – respondent musí jasne vedieť,
čo sa s jeho dátami deje ešte pred vyplnením formulára.

---

## Akceptačné kritériá

- [ ] **AC-1:** Po otvorení custom linku systém zobrazí landing stránku s názvom testu, krátkym popisom, odhadovanou dĺžkou a informáciou o spracovaní osobných údajov – bez nutnosti prihlásenia.
- [ ] **AC-2:** Ak test vyžaduje heslo (nastavenie autora), landing stránka zobrazí heslo-pole; bez správneho hesla systém neumožní spustenie testu.
- [ ] **AC-3:** Pred spustením testu respondent aktívne udelí súhlas so spracovaním osobných údajov (checkbox, nie predvyplnené); bez súhlasu sa tlačidlo „Začať" neaktivuje.
- [ ] **AC-4:** Systém respondentovi priradí anonymný session ID (UUID) pri prvom načítaní custom linku; tento ID slúži na sledovanie postupu počas session.
- [ ] **AC-5:** Session ID sa neukladá do localStorage ani sessionStorage bez analytického súhlasu (US-110); ukladá sa výhradne do in-memory stavu počas session.
- [ ] **AC-6:** Ak je custom link neplatný alebo test je archivovaný, systém zobrazí priateľskú error stránku s vysvetlením (bez technických detailov).
- [ ] **AC-7:** Systém neukladá IP adresu respondenta do databázy; zaznamená iba event timestamp a session ID.
- [ ] **AC-8:** Celý test flow je funkčný bez JavaScriptu povoleného pre základné čítanie – interaktívne časti môžu vyžadovať JS, ale landing info musí byť dostupná aj bez neho (SSR).

---

## Technické poznámky

- Custom link format: `/t/{shareId}` kde `shareId` je kryptograficky náhodný slug (napr. 12 znakov base62).
- Heslo k testu sa overuje na serveri – nikdy sa neposiela klientovi, ani nie je súčasťou URL.
- Respondent session: krátkodobý signed cookie (max 4 hodiny) obsahujúci `{ sessionId, testId, startedAt }`.
- SSR (TanStack Start): landing page musí byť server-rendered pre správnu OG meta a indexáciu.
- GDPR checkbox: uložiť `consentGiven: true/false` + timestamp ako súčasť attempt záznamu.

---

## Edge Cases

- Respondent otvorí link po uplynutí platnosti testu: zobraziť stránku „Tento test už nie je dostupný".
- Respondent otvorí rovnaký link v dvoch taboch: oba taby zdieľajú session cookie – oba zobrazia rovnaký stav.
- Respondent sa pokúsi preskočiť landing a ísť priamo na `/t/{id}/start`: server redirect späť na landing, kým neexistuje platný session token.
- Link obsahuje UTM parametre (marketing tracking): parametre sa zahadzujú, neodovzdávajú sa do test flow (ochrana súkromia respondenta).

---

## Závislosti

- Závisí na: US-060 (generovanie custom linku), US-051 (heslo pre respondentov), US-070 (landing stránka)
- Blokuje: US-080 (spustenie testu), US-110 (analytický súhlas)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: validácia custom linku, session cookie logika
- [ ] E2E test: otvorenie linku → landing → súhlas → spustenie testu
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený
- [ ] Privacy review: žiadne PII uložené bez explicitného súhlasu

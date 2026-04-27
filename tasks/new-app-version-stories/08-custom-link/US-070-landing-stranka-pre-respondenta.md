# US-070 – Respondent vidí landing stránku pred spustením testu

| Atribút  | Hodnota                            |
|----------|------------------------------------|
| **ID**   | US-070                             |
| **Priorita** | P0                             |
| **Stav** | Draft                              |
| **Feature** | Custom link – vstup respondenta |
| **Rola** | Respondent                         |

---

## User Story

> Ako **respondent**
> chcem **po otvorení custom linku vidieť jasnú landing stránku s informáciami o teste skôr, ako začnem vyplňovať**
> aby som **vedel, čo sa odo mňa očakáva, aký je účel testu, čo sa udeje s mojimi dátami a či chcem pokračovať**.

---

## Kontext

Landing stránka je prvý kontakt respondenta s testom. Musí byť transparentná, jasná
a GDPR-konformná. Respondent musí mať dostatok informácií na informované rozhodnutie,
či chce test vyplniť. Stránka musí byť dostupná aj bez JavaScriptu (SSR).

---

## Akceptačné kritériá

- [ ] **AC-1:** Landing stránka zobrazuje: `Názov testu / sady`, `Krátky popis` (ak autor vyplnil), `Odhadovanú dĺžku v minútach`, `Počet otázok`, `Typ testu` (jeden test / sada), `Účel testovania` (z US-012 – zobrazený v zrozumiteľnej slovenčine), `Kto test vytvoril` (display_name autora alebo názov organizácie – nie email).
- [ ] **AC-2:** Stránka obsahuje sekciu `Ako spracúvame vaše dáta` s: typom zbieraných osobných údajov (zoznam polí z US-040 bez hodnôt), právnym základom spracovania, dobou uchovávania, kontaktom na správcu dát, odkazom na Privacy Policy (US-140).
- [ ] **AC-3:** Pred aktiváciou tlačidla „Začať" musí respondent zaškrtnúť checkbox: „Prečítal(a) som si informácie o spracovaní osobných údajov a súhlasím s pokračovaním." (nie predvyplnené).
- [ ] **AC-4:** Ak test vyžaduje respondentské heslo (US-051), po kliknutí na „Začať" sa zobrazí heslo-pole; heslo sa overí server-side pred spustením testu.
- [ ] **AC-5:** Celá stránka je server-rendered (SSR – TanStack Start); OG meta tagy sú správne nastavené pre zdieľanie (ale bez citlivých informácií v OG preview).
- [ ] **AC-6:** Ak je test v stave `archived` alebo `draft`, respondent vidí priateľskú stránku „Tento test momentálne nie je dostupný" bez technických detailov.
- [ ] **AC-7:** Stránka je fully responzívna (mobile-first) a prístupná (WCAG 2.1 AA).
- [ ] **AC-8:** Tlačidlo „Začať" je prominentné a vizuálne odlíšené; stránka neobsahuje Matomo, GA ani iné trackovacie skripty bez analytického súhlasu respondenta.

---

## Technické poznámky

- Route: `src/routes/t.$shareId.tsx` (TanStack Start file-based routing).
- SSR loader: načíta test metadata podľa `shareId`; neodhaľuje citlivé dáta (heslo hash, admin email).
- OG meta: `title = "Test: {test_name}"`, `description = "Zúčastni sa testu"`, `og:image` = generický placeholder (bez PII).
- Súhlas checkbox: uložiť `{ consent_given: true, timestamp }` do attempt záznamu pri spustení testu.

---

## Edge Cases

- `shareId` obsahuje špeciálne znaky (path traversal pokus): sanitizovať a validovať ako base62 reťazec; inak → 404.
- Test je sada s 5 testami: landing stránka zobrazí súhrnné info (celkové otázky, odhadovaný čas sady).
- Respondent načíta stránku a nechá ju otvorenú 2 hodiny, potom klikne „Začať": server overí, či je test stále aktívny; ak áno, pokračuje normálne.

---

## Závislosti

- Závisí na: US-060 (share_id), US-040 (zberové polia pre info), US-012 (účel)
- Blokuje: US-071 (vstup s heslom), US-080 (spustenie testu)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: stav archived/draft → správna chybová stránka
- [ ] E2E test: otvorenie linku → landing → súhlas → start
- [ ] Accessibility audit: WCAG 2.1 AA
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený

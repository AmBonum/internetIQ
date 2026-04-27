# US-011 – Autor vypĺňa voliteľné segmentačné údaje

| Atribút  | Hodnota                          |
|----------|----------------------------------|
| **ID**   | US-011                           |
| **Priorita** | P1                           |
| **Stav** | Draft                            |
| **Feature** | Tvorba testu – vstupný formulár |
| **Rola** | Autor / administrátor testu      |

---

## User Story

> Ako **autor testu**
> chcem **voliteľne doplniť ďalšie informácie o sebe a svojej organizácii**
> aby som **umožnil platforme lepšie pochopiť môj kontext a mohol dostávať relevantnejší obsah a odporúčania**.

---

## Kontext

Voliteľné segmentačné polia slúžia na marketingovú analytiku, personalizáciu
odporúčaní testov a interné vyhodnocovanie. Musia byť jasne označené ako
voliteľné a nesmú blokovať postup v tvorbe testu. Podľa GDPR princípu
minimalizácie dát sa zbierajú iba s explicitným informovaním o účele.

---

## Akceptačné kritériá

- [ ] **AC-1:** Formulár obsahuje tieto voliteľné polia (všetky nepovinné, jasne označené „voliteľné"):
  - `Inštitúcia / Firma`,
  - `Odvetvie / Sektor` (dropdown s preddefin. hodnotami + „Iné"),
  - `Pracovná pozícia`,
  - `Veľkosť organizácie` (dropdown: 1, 2–10, 11–50, 51–200, 200+),
  - `Krajina` (ISO 3166-1 alpha-2 dropdown),
  - `Ako ste sa dozvedeli o platforme` (voliteľný dropdown pre zdroj akvizície).
- [ ] **AC-2:** Žiadne voliteľné pole nesmie blokovať odoslanie formulára – formulár je odosielateľný aj keď sú všetky voľby prázdne.
- [ ] **AC-3:** Voliteľné polia sú vizuálne oddelené od povinných (napr. separátor s nadpisom „Voliteľné informácie").
- [ ] **AC-4:** Pole `Krajina` má predvyplnenú hodnotu `SK` (Slovensko) ale môže byť zmenená; neposkytuje sa geolokácia automaticky.
- [ ] **AC-5:** Pole `Odvetvie` musí obsahovať minimálne tieto kategórie: IT & Technológie, Vzdelávanie, Zdravotníctvo, Financie, Výroba, Obchod, Verejná správa, Neziskový sektor, Iné.
- [ ] **AC-6:** Hodnoty voliteľných polí sú uložené oddelene od povinných polí v DB so stĺpcom `source = 'optional_intake'` pre analytické filtrovanie.
- [ ] **AC-7:** Systém nikdy nezobrazuje voliteľné údaje respondentom; sú prístupné iba autorovi a platformovej analytike.

---

## Technické poznámky

- Schéma: `test_author_metadata(author_id FK, institution, sector, position, org_size, country_code CHAR(2), acquisition_source, created_at)`.
- Dropdown hodnoty: udržiavať ako konfiguračnú tabuľku `intake_options(field, value, label_sk, label_en, sort_order)` pre jednoduchú správu.
- Nesmú byť indexované pre fulltext search (ochrana súkromia).

---

## Edge Cases

- Autor zadá free-text do poľa `Odvetvie` cez „Iné" s XSS pokusom: sanitizovať pred uložením.
- Autor sa vráti späť vo wizarde a zmení voliteľné údaje: UPSERT do `test_author_metadata`.
- Platforma v budúcnosti pridá nové voliteľné polia: existujúce záznamy musia mať `NULL` pre nové stĺpce, nie default hodnoty.

---

## Závislosti

- Závisí na: US-010 (povinné vstupné údaje), US-012 (účel spracovania)
- Blokuje: interná analytika platformy

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: opcionálnosť validácie (formulár odosielateľný bez voliteľných polí)
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený

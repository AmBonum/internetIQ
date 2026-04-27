# US-023 – Autor filtruje otázky v knižnici

| Atribút  | Hodnota                          |
|----------|----------------------------------|
| **ID**   | US-023                           |
| **Priorita** | P1                           |
| **Stav** | Draft                            |
| **Feature** | Výber testov                 |
| **Rola** | Autor / administrátor testu      |

---

## User Story

> Ako **autor testu**
> chcem **filtrovať knižnicu otázok podľa kategórie, tagov, typu a ďalších atribútov**
> aby som **efektívne našiel otázky relevantné pre môj test bez prezerania stoviek nesúvisiacich otázok**.

---

## Kontext

Knižnica otázok môže obsahovať stovky položiek. Efektívne filtrovanie je kľúčové
pre použiteľnosť. Filtre musia reagovať okamžite a byť kombinovateľné.

---

## Akceptačné kritériá

- [ ] **AC-1:** Knižnica otázok ponúka tieto filtre:
  - `Kategória` (multi-select, rovnaké hodnoty ako tagy otázok – US-031)
  - `Tagy` (tag cloud s multi-select)
  - `Typ odpovede` (multi-select: text, číslo, výber, viacnásobný výber…)
  - `Odporúčaný typ organizácie`
  - `Odporúčaná cieľová skupina`
  - `Úroveň obtiažnosti` (Ľahká / Stredná / Náročná)
  - `Jazyk` (SK / EN a ďalšie)
- [ ] **AC-2:** Filtrovanie prebieha klientsky real-time bez reloadu.
- [ ] **AC-3:** Počet zodpovedajúcich otázok sa zobrazuje vedľa každého filtrovacieho štítku (napr. „Leadership (23)").
- [ ] **AC-4:** Aktívne filtre sú viditeľné ako odstraňovateľné štítky (chips/badges) nad zoznamom otázok.
- [ ] **AC-5:** Fulltextové vyhľadávanie podľa textu otázky je dostupné kombinovateľne s ostatnými filtrami.
- [ ] **AC-6:** Výsledky môžu byť zoradené podľa: relevance (default), abecedy, popularity (počet použití), dátumu pridania.
- [ ] **AC-7:** Stav filtrov sa uchováva počas celej session výberu otázok; pri odznačení otázky a návrate do filtrov ostávajú aktívne filtre.

---

## Technické poznámky

- Knižnica otázok sa cachuje pri vstupe do kroku ako JSON; filtrovanie je čisto klientske.
- Popularita otázky: counter v `questions(usage_count INT)` incrementovaný pri každom uložení testu.
- Tag cloud: generovať z unikátnych tagov všetkých aktívnych otázok.

---

## Edge Cases

- Zmena jazykového filtra na `EN` keď všetky otázky sú len SK: zobraziť prázdny stav s vysvetlením.
- Kombinovaný filter s 0 výsledkami: zobraziť prázdny stav s tlačidlom „Zrušiť všetky filtre".

---

## Závislosti

- Závisí na: US-022 (vlastný test), US-031 (metadata otázok)
- Blokuje: –

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: kombinovaná filter logika pre každý typ filtra
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený

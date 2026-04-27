# US-021 – Autor filtruje preddefinované testy podľa kritérií

| Atribút  | Hodnota                          |
|----------|----------------------------------|
| **ID**   | US-021                           |
| **Priorita** | P1                           |
| **Stav** | Draft                            |
| **Feature** | Výber testov                 |
| **Rola** | Autor / administrátor testu      |

---

## User Story

> Ako **autor testu**
> chcem **filtrovať katalóg preddefinovaných testov podľa relevantných kritérií**
> aby som **rýchlo našiel testy vhodné pre môj typ organizácie, cieľovú skupinu a odborný účel bez nutnosti prezerať celý katalóg**.

---

## Kontext

Katalóg môže obsahovať desiatky až stovky testov. Bez filtrovania sa stáva
nespravovateľným. Filtre musia byť rýchle (klientske), intuitívne a kombinovateľné.

---

## Akceptačné kritériá

- [ ] **AC-1:** Katalóg poskytuje tieto filtre:
  - `Kategória` (multi-select: napr. IQ, EQ, Technické zručnosti, Leadership, Komunikácia…)
  - `Typ organizácie` (multi-select: Firma, Inštitúcia, Škola, Súkromná osoba…)
  - `Cieľová skupina` (multi-select: Manažéri, Zamestnanci, Študenti, HR…)
  - `Odvetvie` (dropdown)
  - `Dĺžka` (range: do 5 min / 5–15 min / 15–30 min / nad 30 min)
  - `Úroveň náročnosti` (Ľahká / Stredná / Náročná)
- [ ] **AC-2:** Filtre sú kombinovateľné (AND logika medzi kategóriami, OR v rámci jednej kategórie).
- [ ] **AC-3:** Počet výsledkov sa aktualizuje real-time bez reloadu stránky pri každej zmene filtra.
- [ ] **AC-4:** Tlačidlo „Zrušiť filtre" obnoví predvolené zobrazenie celého katalógu jedným kliknutím.
- [ ] **AC-5:** Ak kombinácia filtrov vráti 0 výsledkov, systém zobrazí priateľskú prázdnu stránku s návrhom na zrušenie niektorých filtrov alebo prechod na vlastné otázky (US-022).
- [ ] **AC-6:** Stav aktívnych filtrov sa odráža v URL query params (napr. `?category=iq&audience=managers`) – umožňuje zdieľanie prefiltrov. ovaného pohľadu.
- [ ] **AC-7:** Fulltextové vyhľadávanie podľa názvu alebo popisu testu je dostupné popri filtroch.

---

## Technické poznámky

- Filtrovanie: klientske filtrovanie nad cachovaneným katalógom (JSON blob dotiahnutý pri vstupe do kroku) – žiadne extra API volania pri každej zmene filtra.
- URL sync: použiť `useSearchParams` hook pre udržiavanie stavu filtrov v URL.
- Fulltext: jednoduchý JS `.filter()` cez `title + description` je dostatočný pre katál. do 500 položiek; nad 500 prepnúť na server-side search.

---

## Edge Cases

- URL s neplatnými query params: ignorovať neznáme parametre, aplikovať len validné filtre.
- Katalóg sa aktualizuje kým má autor otvorenú stránku: staré cachovanie je aktívne do refresh – pri generovaní sady sa prevalidujú ID testov na serveri.

---

## Závislosti

- Závisí na: US-020 (katalóg testov)
- Blokuje: –

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: kombinovaná filter logika, URL sync
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený

# US-022 – Autor zostavuje vlastný test z knižnice otázok

| Atribút  | Hodnota                          |
|----------|----------------------------------|
| **ID**   | US-022                           |
| **Priorita** | P1                           |
| **Stav** | Draft                            |
| **Feature** | Výber testov                 |
| **Rola** | Autor / administrátor testu      |

---

## User Story

> Ako **autor testu**
> chcem **zostaviť vlastný test výberom konkrétnych otázok z knižnice**
> aby som **vytvoril presne cielený test na mieru svojej organizácii a cieľovej skupine, bez obmedzení preddefinovaných balíkov**.

---

## Kontext

Vlastný test (custom test) je alternatíva k preddefinovaným sadám. Autor prehľadáva
knižnicu schválených otázok (US-030) a zostavuje z nich test. Na rozdiel od preddefinovaných
testov má plnú kontrolu nad poradím a výberom otázok, ale stále musí zostať v rámci limitu 50 otázok.

---

## Akceptačné kritériá

- [ ] **AC-1:** Autor môže prepnúť z režimu „Preddefinované testy" na režim „Vlastné otázky" + vice versa – výber jedného režimu nevymaže výber z druhého až do finálneho potvrdenia.
- [ ] **AC-2:** V režime „Vlastné otázky" autor vidí knižnicu otázok rozdelenú do kategórií s počtom dostupných otázok per kategória.
- [ ] **AC-3:** Autor môže otázky vyberať jednotlivo (checkbox) alebo celú kategóriu naraz; systém zobrazuje live počítadlo vybraných otázok.
- [ ] **AC-4:** Limit je 50 otázok na jeden test; systém real-time deaktivuje checkboxy pre ne-vybrané otázky po dosiahnutí limitu s vysvetľujúcou hláškou.
- [ ] **AC-5:** Autor môže zmeniť poradie vybraných otázok pomocou drag-and-drop alebo šípok (hore/dole) v paneli vybraných otázok.
- [ ] **AC-6:** Autor môže pred výberom prezrieť celú otázku (text, typ odpovede, príklady) v detail paneli bez toho, aby ju automaticky pridal.
- [ ] **AC-7:** Test musí mať minimálne 3 otázky – pri pokuse o pokračovanie s menej otázkami systém zobrazí validačnú hlášku.
- [ ] **AC-8:** Autor môže uložiť rozrobený výber ako draft (US-161) a pokračovať neskôr bez straty výberu.

---

## Technické poznámky

- Schéma: `custom_test_questions(test_id FK, question_id FK, sort_order INT)`.
- Live počítadlo: real-time React state, žiadny API call pri každom kliknutí.
- Drag-and-drop: použiť `@dnd-kit/core` alebo ekvivalent kompatibilný s React 19.
- Persist draftu: uložiť výber do Supabase `test_drafts` tabuľky pri každom výbere s debounce 2 sekundy.

---

## Edge Cases

- Autor vyberie 50 otázok a následne odznačí 10: systém re-aktivuje checkboxy pre ne-vybrané.
- Otázka bola medzičasom deaktivovaná správcom: pri uložení/generovaní testu server odmietne deaktivovanú otázku s chybou.
- Drag-and-drop nefunguje na dotykových zariadeniach: poskytnúť fallback (šípky hore/dole).

---

## Závislosti

- Závisí na: US-030 (knižnica otázok), US-024 (kapacitné limity)
- Blokuje: US-023 (filtrovanie otázok), US-040 (zber dát)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: limit 50 otázok, minimálne 3 otázky validácia
- [ ] E2E test: výber otázok → zmena poradia → uloženie draftu
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený

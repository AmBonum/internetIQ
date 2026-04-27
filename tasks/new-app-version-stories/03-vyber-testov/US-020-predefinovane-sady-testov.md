# US-020 – Autor si vyberá z preddefinovaných sád testov

| Atribút  | Hodnota                          |
|----------|----------------------------------|
| **ID**   | US-020                           |
| **Priorita** | P0                           |
| **Stav** | Draft                            |
| **Feature** | Výber testov                 |
| **Rola** | Autor / administrátor testu      |

---

## User Story

> Ako **autor testu**
> chcem **si prezerať a vybrať z katalógu preddefinovaných testov alebo tematických sád**
> aby som **nemusel tvoriť test od nuly a mohol rýchlo začať s overenými otázkami pre môj kontext**.

---

## Kontext

Preddefinované testy sú kurátorsky pripravené a schválené správcom platformy.
Autor si vyberá jeden alebo viacero testov do sady (max 5). Každý test v katalógu
je popísaný metadátami, ktoré autorovi pomôžu vybrať správny test pre jeho účel.

---

## Akceptačné kritériá

- [ ] **AC-1:** Katalóg testov zobrazuje každý test formou karty s: názvom, krátkym popisom (max 160 znakov), počtom otázok, odhadovanou dĺžkou (minúty), kategóriou, tagmi a odporúčanou cieľovou skupinou.
- [ ] **AC-2:** Autor môže vybrať 1 až 5 testov do svojej sady; pri pokuse o výber 6. testu systém zobrazí jasné upozornenie s limitom.
- [ ] **AC-3:** Vybrané testy sú vizuálne odlíšené (napr. checkmark badge) a zobrazené v súhrnnom paneli s celkovým počtom otázok.
- [ ] **AC-4:** Celkový počet otázok naprieč vybranými testami nesmie presiahnuť 250 (5 × 50); systém túto podmienku kontroluje real-time.
- [ ] **AC-5:** Autor si môže prezrieť otázky konkrétneho testu pred výberom (modal alebo rozbaľovací panel) bez toho, aby test automaticky pridal do sady.
- [ ] **AC-6:** Katalóg testov je dostupný iba pre aktuálne publikované a aktívne testy; archivované testy sa nezobrazujú.
- [ ] **AC-7:** Systém umožňuje výber celej preddefinovanej sady jedným kliknutím (ak sada obsahuje max 5 testov) – tzv. „quick pick".
- [ ] **AC-8:** Stav výberu sa zachová pri navigácii späť vo wizard flow.

---

## Technické poznámky

- Schéma: `test_catalog(id, title, description, category, tags TEXT[], estimated_minutes INT, question_count INT, status ENUM('active','archived'), target_audience)`.
- Vzťah: `test_pack_items(pack_id FK, catalog_test_id FK, sort_order INT)` pre uloženie výberu autora.
- Real-time počítadlo otázok: kalkulovať na klientskej strane zo selectovaných testov bez extra API callu.
- Katalóg sa cachuje na CDN edge s TTL 5 minút (obsah sa nemení často).

---

## Edge Cases

- Katalóg je prázdny (platformа ešte nemá žiadne aktívne testy): zobraziť stav „čoskoro" s odkazom na tvorbu vlastného testu (US-022).
- Autor vyberie test, ktorý medzičasom správca archivoval: pri odoslaní formulára server odmietne archivovaný test s jasnou chybou.
- Preddefinovaný test má 0 otázok (broken state): filtrovať z katalógu na serverovej strane.

---

## Závislosti

- Závisí na: US-010 (vyplnený vstupný formulár), US-024 (kapacitné limity)
- Blokuje: US-040 (konfigurácia zberových polí)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: limit 5 testov, real-time počet otázok
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený

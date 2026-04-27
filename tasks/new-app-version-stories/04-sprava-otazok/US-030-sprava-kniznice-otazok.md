# US-030 – Správca systému spravuje knižnicu otázok

| Atribút  | Hodnota                          |
|----------|----------------------------------|
| **ID**   | US-030                           |
| **Priorita** | P0                           |
| **Stav** | Draft                            |
| **Feature** | Správa otázok                |
| **Rola** | Správca systému (platform admin) |

---

## User Story

> Ako **správca platformy**
> chcem **pridávať, upravovať, deaktivovať a organizovať otázky v knižnici**
> aby som **udržiaval kvalitnú, aktuálnu a štruktúrovanú zásobu otázok pre autorov testov**.

---

## Kontext

Knižnica otázok je centrálny obsahový modul platformy. Správca (nie bežný autor)
má výhradné právo pridávať a schvaľovať otázky. Otázky prechádzajú schvaľovacím
procesom pred tým, ako sa stanú dostupnými pre autorov. V budúcej verzii môže
byť schvalovala aj autorom (self-service), ale v P0 je to admin-only.

---

## Akceptačné kritériá

- [ ] **AC-1:** Správca môže pridať novú otázku s týmito povinnými poliami: `text otázky`, `typ odpovede`, `kategória`, `jazyk`; nepovinné: `tagy`, `odporúčané použitie`, `obtiažnosť`, `časový limit (sekundy)`.
- [ ] **AC-2:** Správca môže editovať existujúcu otázku; históriu zmien uchováva systém vo verziovacom log (US-160 princípy aplikované na otázky).
- [ ] **AC-3:** Správca môže otázku deaktivovať (nie zmazať); deaktivovaná otázka:
  - sa nezobrazuje v knižnici pri novom výbere,
  - zostáva dostupná v existujúcich publikovaných testoch až do ich archivácie.
- [ ] **AC-4:** Bulk import otázok je podporovaný cez CSV upload s povinnou validáciou pred importom; nevalidné riadky sú reportované s číslom riadku a popisom chyby.
- [ ] **AC-5:** Správca môže duplicitnú otázku flagovať ako „podobná" a prepojiť ju s originálom (soft link); systém nevyblokuje, ale upozorní pri výbere podobnej otázky.
- [ ] **AC-6:** Otázka má stav schválenia: `draft → review → approved → deprecated`; iba `approved` otázky sú viditeľné pre autorov.
- [ ] **AC-7:** Správca vidí využitie každej otázky (v koľkých testoch je použitá) a dátum poslednej zmeny.

---

## Technické poznámky

- Schéma: `questions(id UUID, text TEXT, answer_type ENUM, category, tags TEXT[], language CHAR(2), difficulty ENUM, time_limit_seconds INT, usage_count INT, status ENUM('draft','review','approved','deprecated'), created_by, created_at, updated_at)`.
- Verzovacie log: `question_versions(question_id FK, version INT, changed_fields JSONB, changed_by, changed_at)`.
- CSV import: max 200 riadkov na jeden import dávku; async spracovanie pre väčšie súbory.
- Prístup: admin-only routes chránené platform-level auth (oddelená od test admin auth v US-001).

---

## Edge Cases

- Správca sa pokúsi zmazať otázku použitú v publikovanom teste: systém zamietne zmazanie, navrhne deaktiváciu.
- CSV import obsahuje otázku s rovnakým textom: systém upozorní na potenciálny duplikát, ale import nablokuje (iba warning).
- Otázka je vo verzii `approved` a správca ju zmení: automaticky prechádza do `review` stavu – vyžaduje re-schválenie.

---

## Závislosti

- Závisí na: US-031 (metadata otázok), US-032 (typy odpovedí)
- Blokuje: US-022 (vlastný test), US-023 (filtrovanie)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: stavový automat (draft→review→approved→deprecated)
- [ ] Integračné testy: CSV import validácia, deaktivácia otázky v aktívnom teste
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený

# US-024 – Systém vynucuje kapacitné limity testov

| Atribút  | Hodnota                          |
|----------|----------------------------------|
| **ID**   | US-024                           |
| **Priorita** | P0                           |
| **Stav** | Draft                            |
| **Feature** | Výber testov                 |
| **Rola** | Systém / platforma               |

---

## User Story

> Ako **platforma**
> chcem **vynucovať kapacitné limity (max 5 testov v sade, max 50 otázok v teste)**
> aby som **ochránila výkon systému, zaistila primeranú dĺžku testu pre respondentov a zabránila zneužitiu**.

---

## Kontext

Limity sú definované produktom: maximálne 5 testov v jednej sade a maximálne 50 otázok
v jednom teste. Tieto limity musia byť vynucované na klientskej aj serverovej strane –
klientska validácia je UX optimalizácia, serverová validácia je bezpečnostná požiadavka.

---

## Akceptačné kritériá

- [ ] **AC-1:** Systém vynucuje limit **max 5 testov** v jednej sade na:
  - klientstskej strane (deaktivácia výberu po 5 testoch) a
  - serverovej strane (odmietnutie requestu s HTTP 422 Unprocessable Entity a jasnou chybou).
- [ ] **AC-2:** Systém vynucuje limit **max 50 otázok** v jednom teste na:
  - klientskej strane (deaktivácia checkboxov, live počítadlo) a
  - serverovej strane (odmietnutie requestu s HTTP 422).
- [ ] **AC-3:** Chybové hlášky na klientskej strane sú zobrazené okamžite (nie len pri odoslaní) – pri každom výbere sa aktualizuje live counter.
- [ ] **AC-4:** Serverová validácia je nezávislá od klientskej: každý API endpoint, ktorý prijíma konfiguráciu testu, vykonáva validáciu limitov bez ohľadu na klientské vstupy.
- [ ] **AC-5:** Limity sú konfigurovateľné cez platformovú konfiguráciu (konštanty, nie hardcoded literály v kóde) – umožňuje budúcu zmenu bez zásahu do logiky.
- [ ] **AC-6:** Pokus o obídenie limitov cez priamy API call je zaznamenaný do audit logu s IP a timestampom.
- [ ] **AC-7:** Pri pokuse o generovanie testu z existujúceho draftu, ktorý porušuje limity (napr. otázka bola pridaná manuálne), server zablokuje generovanie s detailnou chybou uvádzajúcou presné porušenie.

---

## Technické poznámky

- Konštanty: `MAX_TESTS_PER_PACK = 5`, `MAX_QUESTIONS_PER_TEST = 50` definované v centrálnom config module.
- Server validácia: Zod schema alebo custom guard na každom mutation endpoint.
- Audit log: iba pre serverové zamietnutia (nie klientske UI blokovanie).
- Celkové otázky v sade si nevyžaduje osobitný limit, ale je informačne zobrazovaný (5 × 50 = max 250).

---

## Edge Cases

- Správca zmení limit v konfigurácii: existujúce drafty s hodnotami nad novým limitom sú pri ďalšom uložení zamietnuté – systém upozorní autora na nutnosť úpravy.
- Súbežné editovanie sady dvomi adminmi (tímový prístup, US-003): race condition môže viesť k dočasnému prekročeniu limitu – server vykoná final validation pri každom save.

---

## Závislosti

- Závisí na: US-020 (preddefinované sady), US-022 (vlastný test)
- Blokuje: US-060 (generovanie testu bez platnejkonfigurácie)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: oba limity, klientska aj serverová validácia
- [ ] Integračný test: obídenie limitu priamym API callom → HTTP 422
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený

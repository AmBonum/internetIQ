# US-101 – Autor prehliada zoznam respondentov

| Atribút  | Hodnota                            |
|----------|------------------------------------|
| **ID**   | US-101                             |
| **Priorita** | P0                             |
| **Stav** | Draft                              |
| **Feature** | Admin dashboard                 |
| **Rola** | Autor / administrátor testu        |

---

## User Story

> Ako **autor testu**
> chcem **vidieť prehľadný zoznam všetkých respondentov a their stav dokončenia**
> aby som **mal rýchly prehľad o tom, koľko ľudí test vyplnilo, kto test ešte nedokončil a kedy naposledy bola odpoveď zaznamenaná**.

---

## Kontext

Zoznam respondentov je primárny pohľad v admin dashboarde. Umožňuje rýchlu orientáciu
v stave testovania bez nutnosti otvárať každý záznam. Musí byť paginovaný pre veľké sady.

---

## Akceptačné kritériá

- [ ] **AC-1:** Zoznam zobrazuje pre každého respondenta: pseudonymné ID (nie email v zozname pre ochranu súkromia v prvom pohľade), stav (`Dokončený / Prebieha / Prerušený / Opustený`), dátum a čas začatia, dátum a čas dokončenia (ak dokončil), čas vyplňovania (minúty), počet odpovedaných otázok z celkového počtu.
- [ ] **AC-2:** Email a PII respondenta sú v zozname skryté (zobrazené iba v detaile US-102); autor musí kliknúť na riadok pre zobrazenie PII.
- [ ] **AC-3:** Zoznam je zoraditeľný podľa: dátumu (default), stavu, dĺžky vyplňovania.
- [ ] **AC-4:** Zoznam je filtrovateľný podľa stavu (`Všetky / Dokončené / Prebieha / Prerušené / Opustené`).
- [ ] **AC-5:** Zoznam je paginovaný: 25 respondentov na stránku; zobrazuje celkový počet a aktuálnu stránku.
- [ ] **AC-6:** Tlačidlo „Exportovať zoznam" exportuje zoznam ako CSV (US-131) – iba viditeľné stĺpce plus email ak autor PII zobrazenie povolí.
- [ ] **AC-7:** Pre sadu testov zoznam zobrazuje stav dokončenia per-test (badge pre každý test v sade).
- [ ] **AC-8:** Reálny čas: zoznam zobrazuje badge „LIVE" pre aktuálne prebiehajúce testy (stav `in_progress` s `last_activity_at` < 5 minút); aktualizuje sa každých 60 sekúnd.

---

## Technické poznámky

- Query: `SELECT attempt_id, status, started_at, completed_at, (completed_at - started_at) as duration FROM test_attempts WHERE test_id = {id} ORDER BY started_at DESC LIMIT 25 OFFSET {page*25}`.
- Pseudonymné ID: `SUBSTRING(UUID, 1, 8)` alebo `#001, #002...` poradie pre lepší UX.
- PII v zozname: zobraziť email iba ak existuje `show_pii: true` query param + platná session.
- LIVE badge: `WHERE status = 'in_progress' AND last_activity_at > NOW() - INTERVAL '5 minutes'`.

---

## Edge Cases

- Test má 0 respondentov: zobraziť prázdny stav s „Zdieľajte custom link na získanie odpovedí."
- Test má 10,000+ respondentov: paginovanie musí zostať rýchle (DB index na `test_id + started_at`).
- Respondent začal test 3-krát (admin resetoval attempt): zobraziť všetky pokusy s číslom pokusu.

---

## Závislosti

- Závisí na: US-100 (admin auth), US-080 (attempt data)
- Blokuje: US-102 (detail respondenta), US-130 (export)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: paginovanie, filtrovanie stavu, LIVE badge logika
- [ ] Performance test: 10k respondentov → zoznam < 300ms
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený

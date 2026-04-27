# US-133 – Autor exportuje dáta ako JSON

| Atribút  | Hodnota                              |
|----------|--------------------------------------|
| **ID**   | US-133                               |
| **Priorita** | P2                               |
| **Stav** | Draft                                |
| **Feature** | Export                            |
| **Rola** | Autor / administrátor testu          |

---

## User Story

> Ako **autor testu**
> chcem **exportovať dáta testu vo formáte JSON (vrátane schémy otázok a odpovedí)**
> aby som **mohol integrovať výsledky do interných systémov alebo migrovať dáta na inú platformu**.

---

## Kontext

JSON export je určený pre technicky zdatných autorov a integrátorov systémov. Na
rozdiel od CSV exportu (flat, len odpovede) JSON export môže obsahovať hierarchickú
štruktúru: definícia testu, sekcie, otázky, respondenti s odpoveďami. Umožňuje
aj export samotnej definície testu (bez respondentov) pre zálohu alebo migráciu.

---

## Akceptačné kritériá

- [ ] **AC-1:** Autor môže zvoliť medzi tromi typmi JSON exportu:
  - **Len definícia testu**: štruktúra testu, sekcie, otázky (bez respondentov)
  - **Len dáta respondentov**: answery a metadata attemptov (bez definície testu)
  - **Kompletný export**: definícia + dáta respondentov
- [ ] **AC-2:** JSON schéma je zdokumentované v exporte – každý JSON súbor obsahuje `_schema_version` a `_export_type` pole v root objekte.
- [ ] **AC-3:** Dáta respondentov v JSON sú pseudonymizované rovnako ako v CSV (autor volí úroveň PII inclusion – len attempt_id alebo + identifikačné polia).
- [ ] **AC-4:** JSON export testovej definície je použiteľný na import testu späť do platformy (US-165/template feature) – schéma je kompatibilná.
- [ ] **AC-5:** Export veľkých dát (> 1000 respondentov) je streamovaný ako NDJSON (Newline-Delimited JSON) alebo ZIP s viacerými JSON súbormi.
- [ ] **AC-6:** Export je spúšťaný cez rovnaké UI a rate-limit mechanizmy ako CSV (US-131).
- [ ] **AC-7:** JSON súbor obsahuje `metadata.generated_at`, `metadata.test_id`, `metadata.respondent_count`.
- [ ] **AC-8:** Stiahnutý súbor má správny Content-Type `application/json` a správny filename (`test_{id}_export_{date}.json`).

---

## Technické poznámky

- Root JSON štruktúra:
  ```json
  {
    "_schema_version": "1.0",
    "_export_type": "full",
    "metadata": { "generated_at": "...", "test_id": "...", "respondent_count": 42 },
    "test_definition": { ... },
    "respondents": [ { "attempt_id": "...", "answers": [ ... ] } ]
  }
  ```
- NDJSON pre streaming: každý respondent = jeden JSON objekt na jeden riadok, Content-Type `application/x-ndjson`.

---

## Edge Cases

- Test bol verzionovaný (US-160): JSON export obsahuje `version_id` per attempt (v čase testovania).
- Import JSON z exportu späť na platformu (import funkcia US-165): ak schéma verzia nie je kompatibilná, import vráti chybu s migration guide.
- JSON export > 50 MB: automaticky ZIP-ovaný (`application/zip`).

---

## Závislosti

- Závisí na: US-131 (zdieľaný rate-limit), US-080 (attempt data)
- Blokuje: US-165 (import testu z JSON – vyžaduje kompatibilnú schému)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: _schema_version prítomnosť, NDJSON streaming pre > 1000 respondentov
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený

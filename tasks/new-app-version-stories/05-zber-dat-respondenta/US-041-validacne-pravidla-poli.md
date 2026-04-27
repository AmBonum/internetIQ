# US-041 – Autor nastavuje validačné pravidlá pre polia

| Atribút  | Hodnota                           |
|----------|-----------------------------------|
| **ID**   | US-041                            |
| **Priorita** | P1                            |
| **Stav** | Draft                             |
| **Feature** | Zber dát od respondentov       |
| **Rola** | Autor / administrátor testu       |

---

## User Story

> Ako **autor testu**
> chcem **nastaviť validačné pravidlá pre každé zberové pole**
> aby som **zabezpečil, že respondenti zadávajú dáta v správnom formáte a rozsahu, a minimalizoval nepoužiteľné odpovede**.

---

## Kontext

Validačné pravidlá zaručujú dátovú kvalitu. Autor ich nastavuje v konfigurátore polí
(US-040). Validácia prebieha na klientskej strane (UX) aj serverovej strane (bezpečnosť).
Každý typ poľa má vlastnú sadu dostupných pravidiel.

---

## Akceptačné kritériá

- [ ] **AC-1:** Pre typ `short_text` / `long_text`: konfigurovateľné `min_length` a `max_length` (počet znakov); `max_length` nesmie presiahnuť 5000.
- [ ] **AC-2:** Pre typ `number`, `percentage`, `currency`, `range`: konfigurovateľné `min_value` a `max_value`; systém validuje, že `min_value < max_value`.
- [ ] **AC-3:** Pre typ `single_choice` / `multi_choice`: author môže nastaviť `min_selections` a `max_selections`.
- [ ] **AC-4:** Pre typ `date`: konfigurovateľné `min_date` a `max_date`; support pre relatívne dátumy (`today`, `today - 18 years`).
- [ ] **AC-5:** Každé pole môže byť označené `required: true`; v takom prípade respondent nemôže pokračovať bez vyplnenia.
- [ ] **AC-6:** Autor môže pre textové polia definovať `pattern` (regulárny výraz) s vlastnou chybovou hláškou pre respondenta; systém validuje, že regex je syntakticky správny.
- [ ] **AC-7:** Validačné pravidlá sú uložené v `config JSONB` (viď US-040) – zdieľaná schéma s renderovacím enginom.
- [ ] **AC-8:** Chybové hlášky pre respondenta sú v slovenčine; autor ich môže customizovať (max 200 znakov na hlášku).

---

## Technické poznámky

- Regex bezpečnosť: pred uložením otestovať regex na potenciálny ReDoS (Regular Expression Denial of Service) – odmietnuť exponenciálne komplexné patterny.
- Zdieľaná Zod schema: `intake_field_validation_schema` použitá na klientovi (React Hook Form) aj na serveri (API middleware).
- Relatívne dátumy: uložiť ako `{ type: 'relative', offset: -18, unit: 'years' }` a vypočítavať pri renderovaní.
- Custom chybové hlášky: uložiť v `config.error_messages: { required, pattern, min, max }`.

---

## Edge Cases

- Regex nastavený pre `email` pole (typ `email`): systém kombinuje RFC validation + custom pattern (obe musia platiť).
- `min_date = max_date`: blokujúca validácia – dátumový rozsah musí byť nenulový.
- Respondent posiela odpoveď mimo konfigurovného rozsahu priamym API callom: server odmietne s `HTTP 422` a chybovým popisom.

---

## Závislosti

- Závisí na: US-040 (konfigurácia polí), US-032 (typy polí)
- Blokuje: US-080 (vyplňovanie testu respondentom)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: každé validačné pravidlo pre každý typ poľa, ReDoS detection
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený

# US-042 – Autor konfiguruje pokročilé nastavenia poľa

| Atribút  | Hodnota                           |
|----------|-----------------------------------|
| **ID**   | US-042                            |
| **Priorita** | P2                            |
| **Stav** | Draft                             |
| **Feature** | Zber dát od respondentov       |
| **Rola** | Autor / administrátor testu       |

---

## User Story

> Ako **autor testu**
> chcem **pre každé zberové pole nastaviť pokročilé voliteľné vlastnosti (predvyplnené hodnoty, placeholder, anonymizácia, viditeľnosť v reporte)**
> aby som **zlepšil UX respondenta, ochránil citlivé dáta a kontroloval, čo sa zobrazuje vo výsledkovom prehľade**.

---

## Kontext

Pokročilé nastavenia sú voliteľné rozšírenia základnej konfigurácie (US-040) a validácie (US-041).
Väčšina autorov ich nevyužije, ale firemní a inštitucionálni klienti ich pri pokročilých
use-casoch potrebujú.

---

## Akceptačné kritériá

- [ ] **AC-1:** `Placeholder` – autor môže definovať nápovedu zobrazovanú v prázdnom poli (greyed-out text); max 150 znakov.
- [ ] **AC-2:** `Predvyplnená hodnota` – autor môže nastaviť default hodnotu, ktorú respondent môže zmeniť alebo odstrániť; musí byť validná podľa validačných pravidiel poľa.
- [ ] **AC-3:** `Interná poznámka` – voľný text viditeľný iba pre autora/admina v konfigurátore a reporte; nikdy sa nezobrazuje respondentovi.
- [ ] **AC-4:** `Viditeľnosť v reporte` – toggle: ak vypnuté, pole sa zbiera ale nezobrazuje v admin dashboard prehľade (skryté, ale stále exportovateľné).
- [ ] **AC-5:** `Zaradenie do exportu` – toggle: ak vypnuté, pole sa nezahŕňa do žiadnych exportov (PDF, CSV, JSON); uložené ale exportne skryté.
- [ ] **AC-6:** `Anonymizácia` – toggle pre polia s PII: ak zapnuté, hodnoty sú pri ukladaní pseudonymizované (hash + salt uložený oddelene); zobrazujú sa ako `[anonymizované]` v reporte.
- [ ] **AC-7:** Polia s `anonymizácia = true` nie sú zahrnuté do emailových exportov (US-133); exportujú sa iba v JSON s explicitným potvrdením.
- [ ] **AC-8:** Pokročilé nastavenia sú kolapsovateľná sekcia v UI konfigurátora – základné nastavenia sú vždy viditeľné.

---

## Technické poznámky

- `anonymization_salt`: unikátny per-test salt uložený oddelene od dát respondentov; pri mazaní testu sa salt maže prvý (čím sa anonymizácia stáva ireverzibilnou).
- Pseudonymizácia algoritmus: `HMAC-SHA256(value, salt)` → hex string.
- `visible_in_report` a `include_in_export` flags: uložené v `intake_field_configs`; export a report engine ich rešpektujú.
- Predvyplnená hodnota: validovať oproti `config.min`, `config.max`, `config.pattern` pri uložení konfigurácie.

---

## Edge Cases

- Autor nastaví predvyplnenú hodnotu, ktorá porušuje `min_length`: blokujúca validácia pri uložení konfigurácie.
- Pole má `anonymizácia = true` ale autor chce exportovať: systém zobrazí varovanie a vyžaduje explicitné potvrdenie.
- Autor skryje všetky polia z reportu: systém upozorní (toast), ale neblokuje – admin dashboard bude prázdny.

---

## Závislosti

- Závisí na: US-040 (konfigurácia polí), US-041 (validácia), US-164 (anonymizácia/mazanie)
- Blokuje: US-130–US-134 (export musí rešpektovať tieto nastavenia)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: anonymizácia (hash + salt), export flag logika
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený

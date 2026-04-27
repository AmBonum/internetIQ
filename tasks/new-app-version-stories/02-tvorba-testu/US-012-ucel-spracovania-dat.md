# US-012 – Autor definuje účel spracovania dát

| Atribút  | Hodnota                          |
|----------|----------------------------------|
| **ID**   | US-012                           |
| **Priorita** | P0                           |
| **Stav** | Draft                            |
| **Feature** | Tvorba testu – vstupný formulár |
| **Rola** | Autor / administrátor testu      |

---

## User Story

> Ako **autor testu**
> chcem **explicitne definovať, na aký účel zbieram dáta od respondentov**
> aby som **splnil zákonné požiadavky GDPR a respondenti vedeli, prečo test vypĺňajú**.

---

## Kontext

GDPR (čl. 5 ods. 1 písm. b) vyžaduje účelové obmedzenie: dáta sa smú zbierať
iba na konkrétne, výslovne uvedené a legitímne účely. Autor musí pred generovaním
testu zvoliť účel zberu dát. Tento účel bude zobrazený respondentom na landing
stránke a v emailovej notifikácii.

---

## Akceptačné kritériá

- [ ] **AC-1:** Formulár obsahuje povinný krok „Účel testovania" s týmito preddefin. možnosťami (výber jednej alebo viacerých):
  - Interné hodnotenie zamestnancov
  - Vzdelávanie a rozvoj
  - Výberové konanie / nábor
  - Prieskum trhu / zákaznícky výskum
  - Vedecký výskum
  - Vzdelávacia platforma / kurz
  - Vlastné hodnotenie / sebarozvoj
  - Iné (s povinným textovým poľom pre spresnenie).
- [ ] **AC-2:** Autor môže zvoliť maximálne 3 účely naraz; pri výbere 4. systém zobrazí informatívnu hlášku.
- [ ] **AC-3:** Zvolený účel sa uloží do záznamu testu a je neoddeliteľnou súčasťou audit záznamu.
- [ ] **AC-4:** Zvolený účel sa zobrazuje respondentom na landing stránke testu (US-070) v zrozumiteľnej, laickej slovenčine.
- [ ] **AC-5:** Ak autor zvolí „Výberové konanie / nábor", systém zobrazí upozornenie: „Pri spracovaní dát v rámci výberového konania môžu platiť osobitné pravidlá (§ 13 Zákonníka práce). Odporúčame konzultáciu s právnikom."
- [ ] **AC-6:** Účel nie je možné zmeniť po publikovaní testu bez prechodu do stavu `draft` (US-161).
- [ ] **AC-7:** Voľba „Iné" vyžaduje minimálne 10 znakov spresnenia, aby bola akceptovaná.

---

## Technické poznámky

- Schéma: `test_purposes(test_id FK, purpose ENUM, custom_description TEXT, created_at)` – relačná tabuľka pre multi-select.
- Preddefin. účely uložené ako `ENUM` alebo reference tabuľka `purpose_types`.
- Audit: pri zmene účelu (pred publikovaním) zaznamenať starú a novú hodnotu do `audit_log`.
- Respondent-facing text: preložiť enum hodnoty do slovenčiny v i18n vrstve, nie ukladať jazykový text do DB.

---

## Edge Cases

- Autor ponechá „Iné" s textom kratším ako 10 znakov: blokujúca validácia s presnou chybovou hláškou.
- Test bol publikovaný a autor chce zmeniť účel: systém vyžaduje najprv revertovanie do draft stavu (US-161).
- Účel „Vedecký výskum" vyžaduje v niektorých prípadoch etický súhlas: systém informuje, ale nevynucuje (je to zodpovednosť autora).

---

## Závislosti

- Závisí na: US-010 (povinné vstupné údaje)
- Blokuje: US-070 (landing stránka respondenta), US-013 (GDPR súlad)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: multi-select limit, validácia „Iné" poľa
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený
- [ ] Legal review: upozornenie pre výberové konanie schválené

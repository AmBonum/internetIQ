# US-167 – Autor konfiguruje podmienené zobrazenie otázok

| Atribút  | Hodnota                              |
|----------|--------------------------------------|
| **ID**   | US-167                               |
| **Priorita** | P3                               |
| **Stav** | Draft                                |
| **Feature** | Pokročilé funkcie                 |
| **Rola** | Autor / administrátor testu          |

---

## User Story

> Ako **autor testu**
> chcem **nastaviť podmienky pod ktorými sa konkrétna otázka zobrazí alebo skryje na základe predošlých odpovedí respondenta**
> aby som **mohol vytvoriť adaptívne testy, ktoré sú relevantné pre konkrétny profil respondenta**.

---

## Kontext

Podmienená logika (conditional branching) je kľúčová pre adaptívne testy: manažér
vidí iné otázky než radový zamestnanec (reaguje na intake pole „pozícia"), alebo
follow-up otázka sa zobrazí len ak respondent v predošlej otázke vybral konkrétnu
možnosť. Toto dramaticky zvyšuje relevantnosť testu.

---

## Akceptačné kritériá

- [ ] **AC-1:** Autor môže pre každú otázku definovať podmienku zobrazenia: „Zobraziť len ak [pole/otázka] [operátor] [hodnota]".
- [ ] **AC-2:** Podporované zdroje podmienky:
  - Intake pole (napr. `position = 'manager'`)
  - Odpoveď na predošlú otázku (napr. `q5_answer = 'áno'`)
  - Segmentačné pole (US-011)
- [ ] **AC-3:** Podporované operátory: `=`, `!=`, `>`, `<`, `>=`, `<=`, `contains`, `not_contains`, `is_empty`, `is_not_empty`.
- [ ] **AC-4:** Podmienky je možné kombinovať logickými operátormi `AND` / `OR` s vizuálnym condition builderom (nie raw JSON editor pre autora).
- [ ] **AC-5:** Podmienky sú vyhodnocované **server-side** pred odoslaním nasledujúcej otázky respondentovi. Klientská logika slúži len na plynulé UX (optimistic skip), nie ako security gate.
- [ ] **AC-6:** V admin dashboarde môže autor zobraziť „preview" adaptívneho priebehu testu: simulátor vie prejsť rôzne scénare (napr. Manager path vs. Employee path).
- [ ] **AC-7:** Podmienené otázky, ktoré sa nezobrazili respondentovi, sú v CSV/JSON exporte označené `null` (nie chýbajúci stĺpec) s flagom `was_skipped = TRUE`.
- [ ] **AC-8:** Circular dependency (napr. otázka A závisí na B, B závisí na A): validácia pri uložení podmienky deteguje cyklus a zobrazí chyybu „Cyklická závislosť".

---

## Technické poznámky

- Podmienky uložené ako JSONB v `questions.display_conditions`:
  ```json
  {
    "logic": "AND",
    "conditions": [
      { "source": "intake", "field_key": "position", "op": "=", "value": "manager" },
      { "source": "question", "question_id": "uuid", "op": "!=", "value": "nie" }
    ]
  }
  ```
- Server-side evaluátor: pure function `evaluateConditions(conditions, context) → boolean`. Testovateľná bez DB.
- Cyklus detekcia: DFS (depth-first search) cez condition graph pri každom uložení podmienky.

---

## Edge Cases

- Respondent odpovie na otázku A, čo skryje otázku B (ktorú respondent ešte nevidel) a zobrazí C: server odošle C, do exportu vloží B ako `was_skipped = TRUE`.
- Podmienka závisí na intake poli, ktoré autor neskôr vymaže: validácia pri publication check upozorní na „broken condition" otázky.
- Otázka s podmienkou je povinná: ak je podmienka false (otázka sa nezobrazí), povinnosť sa neuplatňuje – otázka je implicitne optional keď skrytá.

---

## Závislosti

- Závisí na: US-032 (typy odpovedí – základ pre condition values), US-040 (intake polia – zdroj podmienok), US-080 (test flow – preskakovanie otázok)
- Blokuje: nič priamo

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: evaluátor podmienok (AND/OR/operátory), circular dependency detekcia
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený

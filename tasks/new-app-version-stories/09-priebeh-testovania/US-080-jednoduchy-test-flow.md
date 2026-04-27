# US-080 – Respondent spúšťa a dokončí jednoduchý test

| Atribút  | Hodnota                            |
|----------|------------------------------------|
| **ID**   | US-080                             |
| **Priorita** | P0                             |
| **Stav** | Draft                              |
| **Feature** | Priebeh testovania              |
| **Rola** | Respondent                         |

---

## User Story

> Ako **respondent**
> chcem **plynulo vyplniť jednoduchý test otázku po otázke a dokončiť ho odoslaním**
> aby som **splnil požiadavku autora testu a zobrazili sa mi moje výsledky**.

---

## Kontext

Toto je hlavný test flow pre prípad, keď sada obsahuje iba jeden test. Respondent
po úspešnom vstupe (US-071) najprv vyplní intake polia (US-040), potom prejde cez otázky
testu a nakoniec odošle test. Celý flow musí byť plynulý, rýchly a responzívny.

---

## Akceptačné kritériá

- [ ] **AC-1:** Respondent najprv vyplní intake polia (definované autorom v US-040); povinné polia musia byť vyplnené pred pokračovaním; validácia prebieha inline.
- [ ] **AC-2:** Otázky sú zobrazené po jednej (one-per-page) alebo v skupinách podľa konfigurácie autora; progress bar zobrazuje percentuálny postup (otázky X z Y).
- [ ] **AC-3:** Respondent môže navigovať späť na predchádzajúce otázky (ak autor neZablokoval navigáciu späť); odpovede sú zachované.
- [ ] **AC-4:** Pre každú otázku s časovým limitom (`time_limit_seconds > 0`) zobrazí viditeľný odpočítavač; po vypršaní sa otázka označí ako „preskočená" a pokračuje sa ďalej.
- [ ] **AC-5:** Odoslanie testu je možné iba ak sú vyplnené všetky povinné otázky; systém zvýrazní nevyplnené povinné otázky.
- [ ] **AC-6:** Respondent vidí tlačidlo „Dokončiť test" iba na poslednej otázke; nie je možné test odoslať skôr.
- [ ] **AC-7:** Po odoslaní systém:
  - uloží kompletné odpovede atomisky (transakcia)
  - označí attempt ako `completed`
  - presmeruje respondenta na výsledkovú stránku (US-082)
- [ ] **AC-8:** Ak respondent stratí pripojenie počas testu, čiastkové odpovede sú lokálne cachované (React state + sessionStorage ak dal analytický súhlas) a môžu byť obnovené po reconnect.

---

## Technické poznámky

- Route: `/t/{shareId}/test/{attemptId}`.
- Attempt: `test_attempts(id UUID, test_id FK, session_id, status ENUM('started','in_progress','completed','abandoned'), started_at, completed_at, intake_data JSONB)`.
- Odpovede: `attempt_answers(id UUID, attempt_id FK, question_id FK, answer_value JSONB, answered_at, time_spent_seconds INT)`.
- Časový limit: client-side countdown timer; po vypršaní POST na server s `timed_out: true`.
- sessionStorage cache: ukladať `{ attemptId, answers: {} }` debounce 3s pri analyticickom súhlase; bez súhlasu uchávať iba v React state.

---

## Edge Cases

- Respondent odošle prázdnu odpoveď pre nepovinné otázky: validné – uložiť `null`.
- Respondent zatvorí tab počas testu: attempt ostáva v stave `in_progress`; po opätovnom otvorení linku systém ponúkne pokračovanie (US-083).
- Autor pridá novú otázku počas aktívneho attempt: snapshot otázok pri štarte testu je nemenný – respondent dokončí pôvodnú verziu.

---

## Závislosti

- Závisí na: US-040 (intake polia), US-032 (typy otázok), US-071 (session), US-053 (bezpečnosť)
- Blokuje: US-082 (výsledková stránka), US-121 (notifikácie)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: progress bar výpočet, časový limit logika, povinné polia validácia
- [ ] E2E test: celý flow (intake → otázky → dokončenie → výsledky)
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený

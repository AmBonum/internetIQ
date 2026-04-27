# US-083 – Respondent uloží postup a pokračuje neskôr

| Atribút  | Hodnota                            |
|----------|------------------------------------|
| **ID**   | US-083                             |
| **Priorita** | P2                             |
| **Stav** | Draft                              |
| **Feature** | Priebeh testovania              |
| **Rola** | Respondent                         |

---

## User Story

> Ako **respondent**
> chcem **prerušiť vypĺňanie testu a pokračovať neskôr od miesta, kde som prestal**
> aby som **nemusel vyplňovať celý test naraz, ak nemám dostatok času alebo som vyrušený**.

---

## Kontext

Dlhé testy alebo sady testov môžu trvať 30+ minút. Respondent musí mať možnosť
bezpečne prerušiť a obnoviť postup. Obnova prebieha cez ten istý link s overením
identity (heslo alebo session token). GDPR implikácia: uloženie čiastkových dát
musí byť v súlade s informovaným súhlasom.

---

## Akceptačné kritériá

- [ ] **AC-1:** Respondentovi je viditeľné tlačidlo „Uložiť a pokračovať neskôr" počas celého test flow (nie len na konci).
- [ ] **AC-2:** Po kliknutí na „Uložiť a pokračovať neskôr" systém uloží stav `(answered_questions, current_question_index, intake_data)` na server a zobrazí informatívnu stránku s inštrukciami, ako sa vrátiť.
- [ ] **AC-3:** Systém odošle respondentovi email (ak poskytol email v intake formulári) s odkazom na obnovenie testu; odkaz obsahuje jednorazový obnovovací token (expires 72 hodín).
- [ ] **AC-4:** Po otvorení obnovovacieho linku respondent zadá heslo (ak test má heslo) alebo je automaticky overený tokenom; po overení sa test otvorí od poslednej uloženej pozície.
- [ ] **AC-5:** Čiastkové odpovede sú uložené server-side ako `status = 'in_progress'` attempt; nie len v local storage.
- [ ] **AC-6:** Ak respondent nevráti sa do 72 hodín, attempt sa označí ako `abandoned`; autor vidí `abandoned` attempts v admin dashboarde.
- [ ] **AC-7:** Respondent vidí upozornenie: „Vaše odpovede budú uložené iba do [dátum+čas]. Po tomto čase nebudú obnoviteľné."
- [ ] **AC-8:** Funkcia je dostupná iba ak autor pre daný test povolil možnosť „Prerušenie testu povolené" (toggle v konfigurácii).

---

## Technické poznámky

- Stav attempts: rozšíriť `test_attempts.status ENUM` o `'in_progress'` a `'abandoned'`.
- Obnovovací token: kryptograficky náhodný 32-byte hex, uložený ako SHA-256 hash; originál poslaný emailom.
- 72-hodinový limit: `test_attempts.resume_expires_at TIMESTAMPTZ`; pg_cron job označí expired ako `abandoned`.
- Čiastkové odpovede: existujúca `attempt_answers` tabuľka; `answered_at` umožňuje zrekonštruovanie pozície.

---

## Edge Cases

- Respondent nemá email v intake formulári: funkcia „Uložiť a pokračovať" je nedostupná (alebo zobrazí info o nutnosti zadania emailu).
- Respondent otvorí obnovenie linku z iného zariadenia: server-side state umožňuje pokračovanie z akéhokoľvek zariadenia.
- Autor test archivuje kým respondent má `in_progress` attempt: attempt zostane archivovateľný, ale respondent pri obnovení uvidí „test bol uzavretý".

---

## Závislosti

- Závisí na: US-080 (test flow), US-062 (email infraštruktúra)
- Blokuje: US-090 (história respondenta – abandoned state)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: obnovovací token flow, 72h expir, abandoned marking
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený

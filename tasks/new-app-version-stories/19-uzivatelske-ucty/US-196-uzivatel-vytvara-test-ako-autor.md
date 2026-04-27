# US-196 – Používateľ vytvára vlastný test ako autor

| Atribút  | Hodnota                              |
|----------|--------------------------------------|
| **ID**   | US-196                               |
| **Priorita** | P0                               |
| **Stav** | Draft                                |
| **Feature** | Používateľské účty                |
| **Rola** | Respondent povyšujúci sa na autora   |

---

## User Story

> Ako **prihlásený používateľ s rolou respondent**
> chcem **môcť si upgradenúť na účet autora a vytvoriť vlastný test alebo sadu testov**
> aby som **mohol testovať iných ľudí, zbierať dáta a spravovať výsledky ako autor**.

---

## Kontext

Respondent, ktorý chce vytvoriť test, nepotrebuje nový účet – jednoducho si
pridá rolu `author` (US-193 self-service upgrade) a má okamžite prístup
k autorskému dashboardu. Autorský a respondentský dashboard sú dve záložky
toho istého `/dashboard` navigačného rootu – nie oddelené aplikácie.

---

## Akceptačné kritériá

- [ ] **AC-1:** V respondentskom dashboarde je prominentné CTA „Chcem vytvoriť test" (button alebo banner). Klik zobrazí krátky upgrade flow:
  1. Info o tom čo dostane (môže vytvárať testy, spravovať výsledky)
  2. Odkaz na ToS pre autorov a checkbox súhlasu (US-142)
  3. Potvrdenie → rola `author` je pridaná okamžite
- [ ] **AC-2:** Po upgrade sa v navigácii zobrazí záložka „Moje testy" (autorský dashboard), vedľa „Moja história" (respondentský). Obe záložky sú dostupné súčasne – autor je stále aj respondent.
- [ ] **AC-3:** Autorský dashboard (`/dashboard/my-tests`) zobrazuje všetky testy kde `tests.owner_id = auth.uid()`:
  - Zoznam testov so statusom (draft/published/archived)
  - Počet respondentov per test
  - Quick actions: Otvoriť admin | Editovať | Duplikovať | Archivovať
- [ ] **AC-4:** Vytvorenie nového testu z dashboardu vedie na existujúci test creation flow (US-010–013, US-020–024 atď.) – nie duplicitná implementácia. Nový test má `owner_id = auth.uid()`.
- [ ] **AC-5:** Autor môže pridávať iných používateľov ako **spolupracovníkov** na konkrétny test s rolami: `owner` (plné práva + mazanie), `editor` (editácia, nie delete), `viewer` (len čítanie výsledkov). Toto nadväzuje na US-003.
- [ ] **AC-6:** Autor môže **odovzdať vlastníctvo testu** inému používateľovi (s rolou author). Odovzdanie vyžaduje súhlas prijímateľa (email notifikácia + potvrdenie).
- [ ] **AC-7:** Keď autor vyplní sám vlastný test (ako respondent), jeho attempt je správne priradený k účtu ale je **oddelený** od adminpohladu – v admin dashboarde nie je zahrnutý v štatistikách (inak by menil vlastné dáta).
- [ ] **AC-8:** Downgrade naspäť na respondent-only (stratiť author rolu): existujúce testy autora zostávajú ale prechodzajú do read-only pre pôvodného autora (US-193 AC-6).

---

## Technické poznámky

- `tests.owner_id UUID REFERENCES auth.users(id)`: nové pole (vs pôvodné per-test admin heslo systém).
- `test_members(test_id, user_id, test_role TEXT CHECK IN ('owner','editor','viewer'), invited_at, joined_at)`: pre spoluprácu.
- Autor vypĺňajúci vlastný test: `attempts WHERE test_id = {testId} AND user_id = auth.uid()` je vylúčený z aggregate štatistík cez `is_owner_self_test BOOLEAN DEFAULT FALSE` flag (nastavený pri vytvorení attempt ak `user_id = test.owner_id`).
- ToS acceptance pri upgrade: `user_tos_consents(user_id, tos_type='author_terms', version, consented_at)`.

---

## Edge Cases

- Autor vyplní vlastný test a potom uvidí výsledky v admin dashboarde: systém ho zobrazí ale s oznakom „Váš attempt" – nie ovplyvňuje agregáty.
- Autor pozve spolupracovníka, ktorý nemá účet: notifikácia emailom, prijímateľ sa zaregistruje (US-190) a automaticky dostane prístup.
- Test bol vytvorený ešte starou (per-test heslo) metódou: `owner_id = NULL` (legacy test). Migrácia: autor si „nárokuje" starý test cez claim flow (zadá staré admin heslo → test sa zviazaní s jeho účtom).

---

## Závislosti

- Závisí na: US-193 (role system – author upgrade), US-010–013 (test creation flow)
- Blokuje: US-197 (admin správa vidí všetkých autorov a ich testy)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: owner self-test vylúčenie z agregátov, ToS záznam pri upgrade
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený

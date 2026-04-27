# US-191 – Respondent si vytvára účet z landing a summary stránky

| Atribút  | Hodnota                              |
|----------|--------------------------------------|
| **ID**   | US-191                               |
| **Priorita** | P0                               |
| **Stav** | Draft                                |
| **Feature** | Používateľské účty                |
| **Rola** | Respondent                           |

---

## User Story

> Ako **respondent vypĺňajúci test**
> chcem **môcť si vytvoriť účet priamo z landing stránky testu alebo zo summary stránky po dokončení**
> aby som **mal trvalý prístup k svojej histórii testov bez prerušenia toku testovania**.

---

## Kontext

Respondent prichádza na custom link testu (US-070) – väčšinou bez účtu. Po
dokončení testu (alebo pred začatím) by mal mať nenásilnú možnosť registrácie.
Registrácia nesmie byť povinná – test musí byť prístupný aj bez účtu
(zachovanie existujúceho správania). Po registrácii sa existujúci attempt
automaticky zviazaný s novým účtom.

---

## Akceptačné kritériá

- [ ] **AC-1:** Na **landing stránke testu** (`/t/{shareId}`) je nenápadný banner/sekcia pod hlavným CTA: „Chcete vidieť vaše výsledky kedykolvek? [Vytvorte si bezplatný účet]". Klik otvorí registračný modal (nie plnoobrazovková redirect).
- [ ] **AC-2:** Na **summary stránke** (`/t/{shareId}/summary` alebo ekvivalentnej stránke po dokončení) je výzva k registrácii prominentnejšia: „Uložte si výsledky natrvalo a sledujte pokrok". Registračný modal alebo inline formulár.
- [ ] **AC-3:** Registrácia z týchto stránok je **zjednodušená**: len email + heslo (2 polia). Po úspešnej registrácii sa používateľovi neodošle overovací email okamžite – dostane 24h "grace period" na verifikáciu počas ktorej má read-access na svoje výsledky.
- [ ] **AC-4:** Po registrácii sa **existujúci attempt automaticky zviazaný** s novým účtom: `attempts.user_id = auth.user.id` ak bol attempt vytvorený v rovnakej session/tab (session cookie match).
- [ ] **AC-5:** Respondent, ktorý sa **prihlási** (má existujúci účet) pred alebo po vyplnení testu, dostane možnosť pridať attempt k svojmu účtu: „Prihláste sa pre uloženie výsledkov". Email v intake poli sa použije na navrhnutie existujúceho účtu.
- [ ] **AC-6:** Celá registrácia a prihlásenie z landing/summary stránky sa deje v **modálnom okne** (nie redirect) – respondent zostane na tej istej stránke.
- [ ] **AC-7:** Registrácia/prihlásenie z testu je **voliteľná** – vždy je tlačidlo „Pokračovať bez účtu" (dismiss modal). Odmietnutie sa zaznamená do `localStorage` a modal sa neopakuje pre danú session.
- [ ] **AC-8:** GDPR: registračný modal obsahuje checkbox súhlasu so spracovaním osobných dát a odkazom na Privacy Policy. Checkbox musí byť explicitne zaškrtnutý (nie pre-checked).

---

## Technické poznámky

- `attempts.user_id UUID NULL REFERENCES auth.users(id)`: NULL = anonymný attempt, NOT NULL = viazaný k účtu.
- Zviazanie existujúceho attempu po registrácii: `UPDATE attempts SET user_id = $newUserId WHERE id = $attemptId AND user_id IS NULL` – len ak session cookie alebo attempt token zodpovedá.
- Grace period: `profiles.email_grace_until TIMESTAMPTZ` – ak `< now()` a email neoverený, prístup obmedzený.
- Registrácia z landing/summary musí byť dostupná bez JS degrade-u (form submit action).

---

## Edge Cases

- Respondent vyplní 3 testy anonymne, zaregistruje sa: systém ponúkne zlúčenie posledného attempu. Staršie anonymné attempts (bez session cookie) nie je možné automaticky pridružiť – manual lookup nie je dostupný v V1 (ochrana pred falošným priradením attempts).
- Respondent zadá email, ktorý má existujúci účet: modal prepnutý na „Prihlásiť sa" s predvyplneným emailom.
- Attempt bol vyplnený na zdieľanom počítači s iným prihláseným používateľom: `attempts.user_id` sa NENASTAVÍ automaticky inej osobe – len ak attempt nemá `user_id` (NULL) a session zodpovedá.

---

## Závislosti

- Závisí na: US-190 (registrácia), US-070 (landing stránka), US-082 (summary stránka)
- Blokuje: US-194 (história testov – vyžaduje viazanosť attempts k účtu)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: attempt claiming logika, grace period
- [ ] Manuálny test: kompletný flow registrácia z landing → attempt viazaný
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený
- [ ] Privacy review: attempt sa nepriraďuje automaticky bez session match

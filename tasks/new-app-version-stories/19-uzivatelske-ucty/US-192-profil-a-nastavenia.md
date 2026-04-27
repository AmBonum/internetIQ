# US-192 – Používateľ spravuje svoj profil a nastavenia

| Atribút  | Hodnota                              |
|----------|--------------------------------------|
| **ID**   | US-192                               |
| **Priorita** | P1                               |
| **Stav** | Draft                                |
| **Feature** | Používateľské účty                |
| **Rola** | Prihlásený používateľ (akákoľvek rola) |

---

## User Story

> Ako **prihlásený používateľ**
> chcem **spravovať nastavenia svojho profilu, hesla a účtu**
> aby som **mal kontrolu nad svojimi osobnými údajmi a zabezpečením účtu**.

---

## Kontext

Nastavenia profilu sú centrálne miesto pre všetky typy používateľov – respondent
aj autor. Zobrazuje sa len to, čo je relevantné pre danú rolu (napr. respondent
nevidí sekciu „Moje testy" kým nevytvoril žiaden).

---

## Akceptačné kritériá

- [ ] **AC-1:** Profil stránka je dostupná z menu po prihlásení na `/account/profile`. Obsahuje: meno/prezývka (editovateľná), email (zobrazený, zmena cez overovací flow), avatar (upload alebo URL, max 2MB, JPEG/PNG/WebP).
- [ ] **AC-2:** Zmena hesla: aktuálne heslo + nové heslo + potvrdenie. Nové heslo musí spĺňať US-052. Po úspešnej zmene sú invalidované všetky ostatné sessions (logout všade okrem aktuálnej).
- [ ] **AC-3:** Zmena emailovej adresy: zadanie novej adresy → overovací email na novú adresu → potvrdenie. Stará adresa zostáva funkčná do overenia novej.
- [ ] **AC-4:** Prehľad aktívnych sessions: používateľ vidí zoznam aktívnych prihlásení (zariadenie/browser, IP country, last active). Môže jednotlivo alebo hromadne odhlásiť iné sessions.
- [ ] **AC-5:** Notifikačné preferencie: používateľ môže globálne vypnúť emailové notifikácie z platformy (odhlásenie z platform-level emailov). Toto je odlišné od per-test notifikácie (US-120).
- [ ] **AC-6:** **Vymazanie účtu (sebaobsluha)**: tlačidlo „Vymazať účet" s potvrdením (zadanie hesla alebo „VYMAZAT"). Vymazanie spustí GDPR erasure flow (US-143) + deaktivácia Supabase Auth účtu. Testy, ktoré používateľ vytvoril ako autor, prejdú do stavu `orphaned` (nie sú zmazané – môžu obsahovať dáta iných respondentov).
- [ ] **AC-7:** Preferencie zobrazovania: jazyk rozhrania (SK/EN, V2), časová zóna (pre správne zobrazenie dátumov v dashboarde).
- [ ] **AC-8:** Všetky zmeny profilu sú logované v `audit_log` (US-163): `resource_type = 'profile'`, `actor_id = user_id`.

---

## Technické poznámky

- Avatar upload: Supabase Storage bucket `avatars/{user_id}` s RLS `user = auth.uid()`.
- Sessions prehľad: `auth.sessions` tabuľka – Supabase poskytuje `supabase.auth.getSession()` a `supabase.auth.admin.listUserSessions()` (server-side only).
- Vymazanie účtu: `supabase.auth.admin.deleteUser(userId)` + erasure trigger (US-143 logika).

---

## Edge Cases

- Používateľ vymaže účet kým je aktívna platba (budúca feature): platobný systém musí byť notifikovaný pred mazaním (webhook).
- Zmena emailu na adresu, ktorú iný používateľ práve verifikuje: first-come-first-served; druhý dostane chybu.
- Orphaned test po vymazaní autora: `tests.owner_id = NULL`, test je stále dostupný pre respondentov (link funguje), admin platformy môže prevziať alebo archivovať.

---

## Závislosti

- Závisí na: US-190 (auth), US-143 (GDPR erasure)
- Blokuje: nič priamo

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: session invalidation po zmene hesla, orphaned test po mazaní
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený

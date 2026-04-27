# US-210 – Super admin: správa používateľov

| Atribút  | Hodnota                              |
|----------|--------------------------------------|
| **ID**   | US-210                               |
| **Priorita** | P1                               |
| **Stav** | Draft                                |
| **Feature** | Super admin konzola               |
| **Rola** | Platform admin                       |

---

## User Story

> Ako **platform admin**
> chcem **vidieť kompletný zoznam registrovaných používateľov s ich rolami, aktivitou a možnosťou správy**
> aby som **mohol moderovať komunitu, riešiť support prípady a vymáhať ToS**.

---

## Kontext

Rozširuje a nahradzuje základný user management z US-197. Táto story pokrýva
komplexný admin prehľad so skutočnými akciami (nie len read-only).

---

## Akceptačné kritériá

- [ ] **AC-1:** `/admin/users` zobrazuje tabuľku všetkých `auth.users` joined s `public.profiles` a `user_roles`. Stĺpce: Email, Meno, Registrovaný, Posledný login, Role, Status (active/deactivated).
- [ ] **AC-2:** Filtrovanie: podľa roly (respondent / author / platform_admin), statusu (active / deactivated), dátumového rozsahu registrácie. Fulltextové hľadanie podľa emailu a mena.
- [ ] **AC-3:** Klik na používateľa → detail panel: profil, pridelené role, počet vytvorených testov (author), počet vyplnených testov (respondent), posledná aktivita, IP adresy posledných 5 loginov (z audit_log).
- [ ] **AC-4:** Admin môže zmeniť rolu používateľa: pridať alebo odobrať rolu `author`, `platform_admin`. Rolu `respondent` nemožno odobrať. Zmena sa loguje do `audit_log`.
- [ ] **AC-5:** Admin môže deaktivovať/reaktivovať účet. Deaktivácia: Supabase `auth.admin.updateUser({ banned: true })`. Deaktivovaný používateľ dostane email s odôvodnením.
- [ ] **AC-6:** Admin môže spustiť „Read-only impersonation" – zobrazí sa `AccountInspector` komponent so všetkými dátami používateľa, bez možnosti zápisu. Každá impersonácia sa loguje s dôvodom (povinný free-text field).
- [ ] **AC-7:** Bulk export vybraných používateľov ako CSV (len metadata: email, meno, rola, created_at, last_sign_in – nie citlivé dáta ako IP adresy).
- [ ] **AC-8:** GDPR DSR panel v detaile používateľa: zobrazí otvorené DSR requesty tohto používateľa (z US-143), umožní zmeniť stav (pending / in_progress / completed / rejected).

---

## Technické poznámky

- Všetky admin akcie cez Supabase Admin API (service role key) volané výhradne z Edge Function, nie z klienta.
- Rate limit: max 50 admin API volaní / minútu / admin session (ochrana pred akidentálnym bulk deaktivovaním).
- Tabuľka je server-side paginated (limit 50 / strana). Cursor-based pagination pre stabilitu pri triedení.

---

## Edge Cases

- Admin sa pokúsi deaktivovať druhého `platform_admin`: povolené, ale UI zobrazí upozornenie „Deaktivujete iného admina". Ak by ostali 0 aktívnych adminov, akcia je zablokovaná.
- Pokus o zmenu vlastnej roly: zablokované (admin nemôže odobrať sebe `platform_admin`).

---

## Závislosti

- Závisí na: US-193 (role systém), US-197 (admin konzola základ)
- Súvisí: US-143 (DSR), US-231 (data management)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: RLS blokácia, impersonácia log, deактивácia guard
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený

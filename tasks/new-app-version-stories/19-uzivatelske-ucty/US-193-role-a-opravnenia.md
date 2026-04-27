# US-193 – Systém spravuje role a oprávnenia používateľov

| Atribút  | Hodnota                              |
|----------|--------------------------------------|
| **ID**   | US-193                               |
| **Priorita** | P0                               |
| **Stav** | Draft                                |
| **Feature** | Používateľské účty                |
| **Rola** | Systém + Platform admin              |

---

## User Story

> Ako **prevádzkovateľ platformy**
> chcem **mať flexibilný role systém kde jeden účet môže mať viacero rolí a role sa dajú udeľovať a odoberať**
> aby som **mohol prispôsobiť oprávnenia podľa toho čo daný používateľ na platforme robí**.

---

## Kontext

Platformové role sú adičné (nie exkluzívne). Používateľ s rolou `author`
automaticky má aj oprávnenia `respondent`. Role v kontexte testu (editor/viewer
tímu – US-003) sú odlišné od platformových rolí a riešia sa separátne.

---

## Akceptačné kritériá

- [ ] **AC-1:** Tri platformové role s hierarchiou oprávnení:
  | Rola | Popis |
  |------|-------|
  | `respondent` | Vypĺňa testy, vidí vlastnú históriu, zdieľa výsledky |
  | `author` | Všetko ako respondent + vytvára a spravuje testy a sady |
  | `platform_admin` | Všetko + správa používateľov, rolí, platformy |

- [ ] **AC-2:** Autor môže automaticky získať rolu `author` self-service: tlačidlo „Chcem vytvoriť test" na `/account/profile` alebo na homepage → zobrazí krátky formulár súhlasu (ToS pre autorov, US-142) → po odsúhlasení je rola pridaná.
- [ ] **AC-3:** Povýšenie na `platform_admin` je výhradne manuálne (existujúci platform_admin musí schváliť). Nie je self-service.
- [ ] **AC-4:** Oprávnenia sú vynucované **server-side** cez Supabase RLS policies a v Edge Function middleware. Klientské skrývanie UI prvkov je len UX; nie security boundary.
- [ ] **AC-5:** `app_metadata.roles` v Supabase JWT je synchronizovaný s `user_roles` tabuľkou. Synchronizácia prebieha cez DB trigger (`AFTER INSERT OR DELETE ON user_roles`): volá Supabase Admin API `updateUserById({app_metadata: {roles: [...]}})`.
- [ ] **AC-6:** Downgrade role (odobratie `author` alebo `platform_admin`): len platform_admin môže odobrať. Pri odobraní `author` roly, existujúce testy používateľa zostávajú (nie sú mazané) ale používateľ ich viac nemôže editovať (len view).
- [ ] **AC-7:** Role kontrola v komponentoch: custom hook `useRole()` vracia `{ isRespondent, isAuthor, isPlatformAdmin }` – derivované z JWT `app_metadata.roles`. Hook používa len prečítanie JWT (nie API call pri každom render).
- [ ] **AC-8:** Audit log (US-163): každá zmena role je logovaná s `actor_id` (kto zmenil), `target_user_id`, `old_role[]`, `new_role[]`.

---

## Technické poznámky

```sql
-- RLS example: len author alebo platform_admin môže INSERT do tests
CREATE POLICY "authors_can_create_tests" ON tests
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('author', 'platform_admin')
    )
  );
```

- JWT sync trigger: `pg_net` extension alebo Supabase Realtime webhook na Supabase Admin API.
- `useRole()` hook: `const roles = user?.app_metadata?.roles ?? []`.
- Test kontextové role (US-003 – owner/editor/viewer per test): sú oddelené od platformových rolí, uložené v `test_members(test_id, user_id, test_role)`.

---

## Edge Cases

- Používateľ má `author` rolu, ale neoverený email: môže vytvoriť test ako draft, nemôže ho publikovať (email verification required pre publish).
- JWT bol vydaný pred role zmenou: staré JWT platí max 1h (expiry). Po expiry je nové JWT s aktuálnymi rolami vydané automaticky (Supabase refresh token).
- Concurrent role grant + revoke: posledný write wins (last-write-wins pre `user_roles` UPSERTs).

---

## Závislosti

- Závisí na: US-190 (auth základy)
- Blokuje: US-194 (história respondentov – vyžaduje respondent rolu check), US-196 (autor upgrade), US-197 (admin správa)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: RLS policy blokácia bez author roly, JWT sync po role grant
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený
- [ ] Security review: server-side role enforcement overené (nie len UI)

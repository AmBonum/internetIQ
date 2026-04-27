# US-231 – Používateľ spravuje a maže vlastné dáta

| Atribút  | Hodnota                              |
|----------|--------------------------------------|
| **ID**   | US-231                               |
| **Priorita** | P0 (GDPR čl. 16, 17, 21)        |
| **Stav** | Draft                                |
| **Feature** | Transparentnosť dát               |
| **Rola** | Akýkoľvek návštevník (aj anonymný)   |

---

## User Story

> Ako **používateľ platformy**
> chcem **mať možnosť upravovať alebo mazať svoje dáta priamo z prehľadu zozbieraných dát**
> aby som **mohol vykonávať GDPR práva bez posielania emailov alebo čakania na admina**.

---

## Kontext

Nadväzuje na US-230 (prehľad dát). Pokrýva GDPR čl. 16 (oprava), čl. 17 (vymazanie),
čl. 21 (námietka). Kľúčový princíp: žiadna akcia nie je nevratná bez verifikácie.
Anonymní návštevníci môžu spravovať len lokálne dáta (localStorage/cookies).

---

## Akceptačné kritériá

### Lokálne dáta (anonymní aj prihlásení)

- [ ] **AC-1:** Na stránke `/moje-data` je pri každom localStorage kľúči tlačidlo „Vymazať". Klik → opis, čo sa stane → potvrdenie → `localStorage.removeItem(key)` → stránka obnoví zobrazenie.
- [ ] **AC-2:** Tlačidlo „Vymazať všetky lokálne dáta" vymaže všetky platforma-owned localStorage a sessionStorage kľúče (definované v `storage-manifest.ts`). Nezmaže third-party kľúče.
- [ ] **AC-3:** Vymazanie consent záznamu z localStorage (`AC-1` alebo `AC-2`) zobrazí consent banner znova pri ďalšej navigácii.

### Profilové dáta (prihlásení)

- [ ] **AC-4:** Sekcia profilu zobrazuje editačný formulár inline (nie redirect). Editovateľné polia: meno (display name), avatar URL. Email nie je editovateľný inline – zmena emailu vyžaduje Supabase email-change flow s potvrdením na oboch adresách.
- [ ] **AC-5:** Uloženie zmeny profilu vyžaduje re-autentifikáciu: aktuálne heslo alebo OTP kód zaslaný na email (používateľ si vyberá metódu). Bez overenia sa UI formulár neodošle.
- [ ] **AC-6:** Zmeny profilu sú auditované v `audit_log(actor_id, action='profile_updated', old_value, new_value)`.

### Odvolanie súhlasov

- [ ] **AC-7:** Sekcia „Súhlasy" umožňuje okamžité odvolanie analytics súhlasu (US-110). Odvolanie nastaví `{ analytics: false }` v consent záznamu a zastaví zbieranie event dát od tohto momentu. Existujúce dáta sa nemaže (ak si to používateľ explicitne nevyžiada – viď AC-9).

### Vymazanie účtu a dát

- [ ] **AC-8:** Tlačidlo „Vymazať môj účet" (v sekcii profilu) spustí 3-krokový flow:
  1. Zobrazenie zoznamu čo sa vymaže a čo ostane (pseudonymizované štatistiky).
  2. Re-autentifikácia (heslo alebo OTP).
  3. Finálne potvrdenie (napísanie slova „VYMAZAŤ").
- [ ] **AC-9:** Po potvrdení sa spustí US-164 (anonymizácia) + US-192 (account deletion) flow. Email potvrdenie odoslané. Účet je deaktivovaný okamžite, DB data anonymizované do 30 dní (cron job).
- [ ] **AC-10:** DSR „Právo na vymazanie" formulár (US-143 odkaz) je dostupný ako záchranná alternatíva pre používateľov, ktorým zlyhá self-service flow.

### Export dát

- [ ] **AC-11:** Tlačidlo „Stiahnuť moje dáta (JSON)" v sekcii profilu stiahne Machine-readable JSON so všetkými DB dátami používateľa (profil, attempts, consents, audit log). Generuje sa on-demand, neočakáva sa rýchlosť < 5s pre bežné profily.
- [ ] **AC-12:** JSON export neobsahuje iných používateľov ani systémové internálie (žiadne foreign user IDs, žiadne admin notes z dotazov).

### Pre anonymných návštevníkov

- [ ] **AC-13:** Ak visitit nie je prihlásený, DB sekcie (AC-4 až AC-12) nie sú zobrazené. Namiesto nich je odkaz na registráciu s vysvetlením, že registrácia umožní plnú správu dát.
- [ ] **AC-14:** Anonymný návštevník môže odoslať DSR request (US-143) z tejto stránky zadaním emailu (neregistrovaný - manuálne spracovanie adminom).

---

## Technické poznámky

- Re-autentifikácia (AC-5, AC-8): Supabase `reauthenticate()` + `verifyOtp()` flow. Session step-up flag `{ aal: 'aal2' }` pri OTP ceste.
- JSON export (AC-11): Edge Function `GET /api/user/export` vráti stream JSON. Service role query obmedzená na `user_id = auth.uid()` z JWT.
- 30-dňový anonymizačný lag (AC-9): `pg_cron` job `anonymize_pending_deletions` bežiaci nightly. Záznamy označené `pending_deletion_at TIMESTAMPTZ`.

---

## Edge Cases

- Používateľ stiahne JSON export, potom vymaže účet: export obsahuje snapshot dát v čase stiahnutia, po vymazaní nie je dostupný nový export.
- Re-auth OTP nie príde (email delay): UI zobrazuje „Znova odoslať OTP" tlačidlo (cooldown 60s). Ak ani tretí pokus zlyhá, stránka odkazuje na DSR formulár.
- Spustenie account deletion a okamžitý logout (tab zatvorí): cron job dokonči anonymizáciu plannírom, stav sa neuloží v RAM.

---

## Závislosti

- Závisí na: US-230 (prehľad dát), US-143 (DSR), US-164 (anonymizácia), US-192 (account deletion)
- Súvisí: US-220 (bezpečnostné štandarly pre re-auth)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: re-auth gate, anonymizácia flow trigger, JSON export obsahu
- [ ] Integration test: full account deletion smoke test na staging DB
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený

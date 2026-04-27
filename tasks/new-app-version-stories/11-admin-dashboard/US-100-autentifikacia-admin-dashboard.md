# US-100 – Autor sa autentifikuje do admin dashboardu

| Atribút  | Hodnota                            |
|----------|------------------------------------|
| **ID**   | US-100                             |
| **Priorita** | P0                             |
| **Stav** | Draft                              |
| **Feature** | Admin dashboard                 |
| **Rola** | Autor / administrátor testu        |

---

## User Story

> Ako **autor testu**
> chcem **bezpečne vstúpiť do admin dashboardu svojho testu pomocou admin hesla**
> aby som **mohol spravovať respondentov, prezerať výsledky a exportovať dáta**.

---

## Kontext

Admin dashboard je prístupný výhradne cez admin heslo nastavené pri tvorbe testu (US-050).
Je to izolovaný prístup per-test – autor nemá prehľad o iných testoch bez ďalšieho prihlásenia.
Táto story definuje login flow pre dashboard (nie pre tvorbu testu – to je covered v US-001).

---

## Akceptačné kritériá

- [ ] **AC-1:** Admin dashboard je prístupný cez URL `/admin/{test_id}` alebo cez odkaz z potvrdzovacieho emailu (US-062).
- [ ] **AC-2:** Bez platnej admin session systém zobrazí login formulár priamo na dashboarde (nie separate login page) – inline gate pattern.
- [ ] **AC-3:** Login formulár obsahuje: pole pre admin heslo (type password), tlačidlo „Prihlásiť sa", odkaz „Zabudli ste heslo?" (spúšťa reset flow z US-050).
- [ ] **AC-4:** Po prihlásení vydá server signed session cookie (`httpOnly, secure, sameSite=Lax`) s expiráciou 8 hodín inaktivity alebo 24 hodín absolútne.
- [ ] **AC-5:** Systém zaznamenáva úspešné aj neúspešné prihlásenia do audit logu (US-163): `(event='admin_login_success/failure', test_id, ip_hash, user_agent_hash, timestamp)`.
- [ ] **AC-6:** Po 5 neúspešných pokusoch v 15-minútovom okne systém dočasne zablokuje prístup na 30 minút s viditeľným odpočítavaním.
- [ ] **AC-7:** Aktívna admin session je zobrazená v dashboarde pravom hornom rohu s menom autora a tlačidlom „Odhlásiť sa".
- [ ] **AC-8:** Odhlásenie invaliduje session cookie server-side; po odhlásení je história prehliadača pre dashboard URL neprístupná (cache-control: no-store).

---

## Technické poznámky

- Inline gate pattern: ak `req.session` nie je platná, server-side vyrenderuje login formulár miesto dashboard obsahu.
- DRY session logic: zdieľaná s US-001 (ak existuje admin auth middleware).
- `admin_sessions` tabuľka: `(id UUID, test_id FK, session_token_hash, created_at, last_activity_at, expires_at, revoked)`.
- Audit log: zaznamenávať `ip_hash = SHA256(first_3_octets_of_ip)` nie presnú IP.

---

## Edge Cases

- Autor pristupuje k dashboardu z iného zariadenia: nová session (neexistuje SSO medzi zariadeniami).
- Session exspiruje počas práce v dashboarde: post-expiry API calls vrátia HTTP 401; UI zobrazí modal „Vaša session vypršala. Prihláste sa znovu." bez straty URL stavu.
- Test bol vymazaný (edge case, admin akcia): `/admin/{test_id}` vráti 404 s jasnou hláškou.

---

## Závislosti

- Závisí na: US-050 (admin heslo), US-053 (bezpečné overenie)
- Blokuje: US-101 (zoznam respondentov), US-102 (detail respondenta), US-103 (analytika)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: session overenie, rate limiting, logout invalidácia
- [ ] Integračné testy: login → session → prístup k dashboardu → logout
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Security review: cache-control headers, httpOnly cookies

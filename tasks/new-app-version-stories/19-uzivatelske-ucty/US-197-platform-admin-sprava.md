# US-197 – Platform admin spravuje používateľov, role a platformu

| Atribút  | Hodnota                              |
|----------|--------------------------------------|
| **ID**   | US-197                               |
| **Priorita** | P0                               |
| **Stav** | Draft                                |
| **Feature** | Používateľské účty                |
| **Rola** | Platform admin                       |

---

## User Story

> Ako **platform admin**
> chcem **mať centrálnu administrátorskú konzolu pre správu všetkých používateľov, rolí, testov a platformových nastavení**
> aby som **mohol zabezpečiť správne fungovanie platformy, riešiť incidenty a plniť compliance požiadavky**.

---

## Kontext

Platform admin je najvyššia rola – má prístup naprieč celou platformou. Táto
role je striktne limitovaná na interných operátorov (nie zákazníkmi). Konzola
je oddelená od autorského a respondentského dashboardu.

---

## Akceptačné kritériá

- [ ] **AC-1:** Platform admin konzola je dostupná na `/admin` – prístupná len pre `platform_admin` rolu. Pokus iného používateľa o prístup vráti 403 (nie redirect na login – aby bola stránka non-discoverable).
- [ ] **AC-2:** **Správa používateľov**: prehľad všetkých používateľov (`/admin/users`):
  - Vyhľadávanie podľa emailu, ID, mena
  - Filter podľa role, stavu (aktívny/neoverený/deaktivovaný), dátumu registrácie
  - Per-user akcie: Zobraziť detail | Zmeniť rolu | Deaktivovať | Vymazať účet | Impersonovať (read-only view)
- [ ] **AC-3:** **Správa rolí**: platform admin môže:
  - Udeliť / odobrať `author` alebo `platform_admin` rolu ľubovoľnému používateľovi
  - Vidieť historiu role zmien (audit log US-163)
  - Vytvoriť „pozvánku" pre nového platform_admina bez existujúceho účtu (invite flow)
- [ ] **AC-4:** **Správa testov platformy**: `/admin/tests`:
  - Zoznam všetkých testov (naprieč všetkými autormi), filtrovateľný
  - Možnosť archivovať, presunúť vlastníctvo (`owner_id` zmeniť) alebo natrvalo zmazať test
  - Zoznam orphaned testov (`owner_id = NULL`)
- [ ] **AC-5:** **Impersonácia** (read-only): platform admin môže zobraziť platformu z pohľadu konkrétneho používateľa (read-only – nemôže danému používateľovi konať). Impersonácia je logovaná v audit logu.
- [ ] **AC-6:** **Platformové nastavenia** (`/admin/settings`):
  - Aktuálna verzia ToS a Privacy Policy (s možnosťou triggernúť re-consent)
  - `CONSENT_VERSION` bump (zobrazí warning: „Toto znovu zobrazí consent banner všetkým používateľom")
  - Maximálne limity platformy (max tests per author, max questions per test, atď.)
  - Email provider konfigurácia (SMTP settings alebo API key pre Resend/Postmark)
- [ ] **AC-7:** **Správa DSR žiadostí** (`/admin/dsr`): zoznam všetkých aktívnych DSR žiadostí (US-143) so stavom a SLA deadline. Platform admin môže manuálne zmeniť status na `completed` alebo `rejected` s poznámkou.
- [ ] **AC-8:** **Export platformových dát**: platform admin môže exportovať agregované platformové štatistiky (celkový počet používateľov, testov, attemptov per mesiac) ako CSV pre reporting. **Neobsahuje PII** – len agregáty.

---

## Technické poznámky

- `/admin` route: middleware kontroluje `app_metadata.roles.includes('platform_admin')` – server-side (SSR), nie klientská kontrola.
- Impersonácia: `supabase.auth.admin.generateLink({ type: 'magiclink', email })` s krátkym TTL (15 min) + `impersonation_log(admin_id, target_user_id, started_at, ended_at)`.
- Soft delete používateľa: `auth.users` deaktivácia cez Supabase Admin API (`banDuration: 'infinity'`) + `profiles.deactivated_at = now()`.
- Platforma limity: `platform_settings(key TEXT PK, value JSONB, updated_at TIMESTAMPTZ, updated_by UUID)` tabuľka – nie env vars (za runtime meniteľné).

---

## Edge Cases

- Platform admin sa pokúsi odobrať rolu `platform_admin` sám sebe: povolené len ak existuje ďalší platform_admin (systém blokuje zníženie na 0 platform_adminov).
- Vymazanie používateľa s aktívnymi testami: testy sa nestanú orphaned automaticky – admin musí explicitne zvoliť čo s nimi (presunúť / archivovať / orphan).
- Impersonácia platform_admin sa pokúsi akciovať (kliknúť Submit): zobraziť modal „Impersonácia je len na čítanie. Akcia nebola vykonaná."

---

## Závislosti

- Závisí na: US-193 (role systém), US-163 (audit log), US-143 (DSR)
- Blokuje: nič (terminálna admin story)

---

## Definition of Done

- [ ] Implementácia kompletná podľa všetkých AC
- [ ] Unit testy: 403 pre non-platform_admin, posledný admin blokácia self-downgrade
- [ ] Integračný test: role grant → JWT sync → RLS overenie
- [ ] `npm run lint` → 0 errors / 0 warnings
- [ ] `npm run build` → úspešný build
- [ ] Code review schválený
- [ ] Security review: impersonácia read-only enforcement overená

## Cieľ

Doplniť všetkých 17 funkčných oblastí do projektu ako **plne klikateľný UI prototyp** s bohatými mock dátami. Backend zostáva dummy — všetky dáta v in-memory store (`src/lib/platform/*`), s field-naming kompatibilným s budúcim Supabase schémou pre neskoršiu mechanickú výmenu.

## Architektúra

### Centrálny store

```text
src/lib/platform/
  types.ts           – všetky doménové TS typy + Zod schémy
  store.ts           – useSyncExternalStore reactive store
  seed.ts            – generátor ~30 testov, ~50 respondentov, ~400 sedení
  audit.ts           – append-only audit log helper
  notifications.ts   – queue + listeners
  consent.ts         – GDPR consent + event log helpers
  exports.ts         – CSV / JSON serializery + jsPDF render
```

Store vystavuje hooky `useTests()`, `useTest(id)`, `useRespondents()`, `useSessions(testId)`, `useNotifications()` atď.

### Hlavné domény (mock tabuľky)

| Entita | Polia (skratka) |
|---|---|
| `Test` | id, slug, share_id, owner_id, team_id, title, description, status (draft/published/archived), version, password_hash, segmentation, gdpr_purpose, intake_fields[], question_ids[], settings, notif_config, created/updated_at |
| `TestVersion` | test_id, version, snapshot, published_at, published_by |
| `Question` | id, type (15+), prompt, options, scoring, categories, author_id, status |
| `Team` + `TeamMember` | id, name, owner_id; member: user_id, role (owner/editor/viewer) |
| `Respondent` | id, email, display_name, anonymized_at, created_at |
| `Session` | id, test_id, version, respondent_id, intake_data, answers[], started_at, finished_at, score, status, ip_hash |
| `BehavioralEvent` | session_id, type, payload, at (per-question time, drop-off, focus loss) |
| `Notification` | id, user_id, event_type, payload, read_at |
| `AuditLogEntry` | actor_id, action, target_type, target_id, diff, at, pii_access (bool) |
| `DSRRequest` | id, requester_email, type (access/erase/portability), status, sla_due_at |

## Routovacia mapa (nové + úpravy)

```text
/app                                 (existuje) – dashboard
/app/tests/new                       (rozšírené) – multi-krokový wizard
/app/tests/$testId                   (rename z /sets/$setId) – editor + 6 tabov
/app/tests/$testId/dashboard         – analytika testu
/app/tests/$testId/respondents       – tabuľka sedení
/app/tests/$testId/respondents/$id   – detail (PII audit-loged)
/app/tests/$testId/versions          – verzionovanie + diff
/app/tests/$testId/notifications     – konfigurácia notifikácií
/app/tests/$testId/audit             – audit log
/app/tests/$testId/exports           – export wizard
/app/library                         – knižnica otázok (autor view)
/app/teams                           – tímy + roly (owner/editor/viewer)
/app/notifications                   – inbox + nastavenia
/app/history                         – moje sedenia ako respondent
/app/help                            – help centrum + onboarding
/app/account/security                – heslá, sessions, policy
/app/legal/dsr                       – GDPR DSR formulár

/t/$shareId                          – respondent intake → otázky → výsledky (nový flow)
/t/$shareId/result/$sessionId        – výsledková stránka respondenta
/s/$slug                             (existuje) – ponecháme ako alias

/legal/privacy /legal/cookies /legal/terms    – cez CMS (už máme)

/admin/questions                     – CRUD knižnice (15+ typov)
/admin/respondents                   – globálny zoznam s PII audit
/admin/audit                         – platform audit log
/admin/dsr                           – DSR queue (30-day SLA)
```

## Pokrytie 17 oblastí

1. **Auth & roly** – `/app/teams`: CRUD tímov, pozývanie cez email, role badge (owner/editor/viewer); per-test heslo už máme; respondent flow bez registrácie zostáva.
2. **Tvorba testu** – wizard `/app/tests/new` (3 kroky: Základ → Segmentácia & GDPR účel → Intake polia). Účel: marketing/research/recruitment/education.
3. **Výber testov** – v editore tab "Otázky" prepínač *Preddefinovaná sada* vs *Vlastný výber* s limitom 50 otázok (badge + disable Add).
4. **Správa otázok** – `/admin/questions` + `/app/library`: 15 typov (single, multi, scale 1-5, scale 1-10, NPS, matrix, ranking, slider, short_text, long_text, date, time, file_upload (mock), image_choice, yes_no), filtre, statusy.
5. **Zber dát respondenta** – v editore tab "Intake": drag-and-drop builder, max 20 polí, typy (text/email/select/checkbox/date), required toggle, validačné pravidlá, anonymizácia toggle.
6. **Bezpečnosť hesiel** – `/app/account/security`: password policy meter (Argon2id wording), session list, rate-limit info banner; lockout simulácia po 5 pokusoch na /s/$slug.
7. **Generovanie testu** – po publishe sa vytvorí `share_id` (8-char base32), summary page s linkom `/t/{shareId}`, "Skopírovať / Email autorovi" akcie.
8. **Custom link landing** – `/t/$shareId`: hero + GDPR info + consent checkbox + heslo (ak je) + intake fields → "Začať test".
9. **Priebeh testovania** – kroky: intake → otázky (1 per page, progress bar, behavioral events) → submit → result. Čiastkové uloženie do `localStorage` (resume banner).
10. **História respondenta** – `/app/history`: zoznam mojich sedení, porovnanie skóre v čase (chart), "Poslať emailom" tlačidlo (toast).
11. **Admin dashboard testu** – `/app/tests/$testId/dashboard`: KPI, score distribúcia, completion rate, ⌀ čas, drop-off funnel, top problematic questions; `/respondents` tabuľka s filtrami (skóre, dátum, segment); detail loguje PII access do audit logu.
12. **Sledovanie & súhlas** – consent record sa pripne k session; behavioral events sú zapínané iba s consentom; "Anonymizovať po 90 dňoch" toggle; per-event preview v dashboarde.
13. **Notifikácie** – `/app/tests/$testId/notifications`: 5 typov (nový respondent, milestone N completions, anomália, expiry, denný sumár), per-event channel (email/in-app), test "Poslať testovaciu"; `/app/notifications` inbox.
14. **Export** – `/app/tests/$testId/exports`: výber formátu (CSV/JSON/PDF), filter, button "Generovať" → stiahnutie reálneho súboru (CSV/JSON cez Blob, PDF cez jsPDF). Agregát sady = pivot.
15. **Legal & privacy** – CMS už spravuje Privacy/Cookies/ToS. Nový `/app/legal/dsr` (request form) + `/admin/dsr` (queue s SLA countdown, status workflow).
16. **Help centrum** – `/app/help`: FAQ accordion (~20 položiek), search, kontakt, onboarding checklist (5 krokov) na dashboarde s persistovaným progresom.
17. **Pokročilé funkcie** – verzionovanie (snapshot pri každom publishe, diff view), draft→published→archived workflow s badgemi, audit log per test, šablóny (5 predvyrobených), podmienené vetvenie (UI builder „ak otázka X = Y, skoč na Z"), pokročilá analytika (segment breakdown).

## Mock data objem (seed)

- 8 členov tímu naprieč 3 tímami
- 30 testov (mix statusov a verzií, ~5 šablón)
- ~120 otázok pokrývajúcich všetkých 15 typov
- 50 respondentov, ~400 sedení (rôzne skóre/časy)
- ~5000 behavioral events (samplované)
- 25 notifikácií, 40 audit záznamov, 3 otvorené DSR requesty

## Postup implementácie (poradie commitov)

1. **Foundation** – `platform/types.ts`, `store.ts`, `seed.ts`, `audit.ts`, rozšírenie navigácie v `/app` sidebar (nová ľavá lišta namiesto stand-alone topbaru).
2. **Migrácia setu → test** – premenovať mock + cesty, ponechať aliasy.
3. **Editor testu (6 tabov)** – Detaily, Intake builder, Otázky (s 50-limitom), Verzie, Notifikácie, Audit.
4. **Wizard `/app/tests/new`** + šablóny.
5. **Respondent flow `/t/$shareId`** – intake → questions → result + resume.
6. **Dashboard + respondents tabuľka + detail s PII audit logom.**
7. **Knižnica `/app/library`** + admin `/admin/questions` rozšírenie typov.
8. **Tímy `/app/teams`** + role.
9. **Notifications centrum + history.**
10. **Exports (CSV/JSON/PDF cez jsPDF — pridať dep).**
11. **Help centrum + onboarding checklist.**
12. **DSR formulár + admin queue + audit globálny.**
13. **Account security stránka.**

## Technické detaily

- Mock store nepoužíva persistenciu medzi page reloadmi (okrem resume v `localStorage` pre respondent flow). Po reloade sa znova naseeduje — to je OK pre prototyp.
- Žiadne reálne emaily / žiadne reálne PDF API — všetko stiahne realný súbor z prehliadača (Blob).
- Žiadny backend = žiadne user accounty: prihlásený user je `currentUser` z mock-u, role sa prepínajú v `/app/teams` (dummy switch).
- Nová dependency: `jspdf` (pre 14). `recharts` použijeme existujúci.
- Všetky nové texty po slovensky, ladené k SubenAI brandu.

## Čo NEROBÍM v tomto kroku

- Žiadne reálne Argon2id/bcrypt — len UI meter + texty.
- Žiadny reálny rate-limit — len UI lockout simulácia.
- Žiadne reálne emaily — toast „Odoslané".
- Žiadna integrácia na Lovable Cloud / Supabase.

## Rozsah & čas

Toto je 3-4 dni práce v plnej veľkosti. Spravím to **iteratívne v jednej veľkej dávke**, ale je možné, že po prvom prejdení budem pýtať doupresnenia na konkrétnych obrazovkách (napr. layout dashboardu, presné typy otázok ktoré chceš vidieť v UI).

Po schválení začnem **Foundation → Editor testu → Respondent flow** ako prvý ucelený vertikálny rez, aby si videl celý loop end-to-end. Ostatné oblasti pridám hneď za tým.

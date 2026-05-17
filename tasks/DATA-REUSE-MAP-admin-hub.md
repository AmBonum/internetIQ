# DATA REUSE MAP — admin-hub Integration

For every admin-hub entity (table, column group, hardcoded data structure),
this document states which strategy applies:

- **NEW** — admin-hub introduces a new table; subenai has no equivalent. Created
  in `supabase/migrations/20260517000000_admin_hub_schema.sql`.
- **MIGRATE** — admin-hub needs data that already exists in subenai, either in
  another table or in code. A one-time data migration moves it into the
  admin-hub-introduced table. Owning story: typically the feature that needs
  the data (not AH-1).
- **REUSE** — the subenai table is canonical; admin-hub reads from it without
  copying. New code joins to or queries the existing table directly.
- **COEXIST** — both subenai and admin-hub have semantically similar entities,
  but they serve different flows and stay independent. No merge, no reuse.

Story `AH-x.y` referenced is the owning story for the migration / wiring /
reuse plumbing. The actual schema (CREATE TABLE) for NEW rows is in AH-1.

---

## Existing subenai entities (preserved as-is)

| Subenai entity | Type | Used by | admin-hub impact |
|---|---|---|---|
| `attempts` | table | `/test` IQ flow, scoring, history | None — preserved, never altered by AH-* |
| `test_sets` | table | `/test/zostav`, `/test/zostava/$id` | None — admin-hub `tests` is a parallel table for `/app/tests/*` |
| `sponsors` | table | `/sponzori`, donations flow | None |
| `donations` | table | sponsorship | None |
| `subscriptions` | table | sponsorship | None |
| `public_sponsors` | view | `/` landing | None |
| `footer_sponsors` | view | site footer | None |
| `attempts_anon` | view | analytics | None |
| `hash_test_set_password`, `verify_test_set_password` | function | `test_sets` password gate | None |
| `purge_expired_respondent_pii` | function | scheduled retention | None — admin-hub `dsr_requests` flow is separate |
| `src/lib/quiz/questions.ts` | hardcoded array (code) | `/test` IQ flow (15 questions) | **MIGRATE** — see Q6 Extend decision |
| `SiteHeader.tsx`, `Footer.tsx` | React components (code) | every public page | None for AH-* mock; AH-9.8 adds conditional "Moje testy" link without rewriting structure |

---

## admin-hub tables — reuse strategy

| admin-hub table | Strategy | Subenai equivalent | Owning story | Notes |
|---|---|---|---|---|
| `profiles` | NEW | none (auth uses `auth.users`) | AH-1.2 | Created on first sign-in via `handle_new_user` trigger |
| `user_roles` | NEW | none | AH-1.2 | Privilege escalation guard via `has_role()` SECURITY DEFINER (AH-1.1) |
| `teams`, `team_members` | NEW | none | AH-1.2 | |
| `categories` | NEW | none (no DB; subenai categories live in code) | AH-1.3 | |
| `topics` | NEW | none | AH-1.3 | |
| `answer_sets` | NEW | none | AH-1.3 | |
| `answers` | NEW | none | AH-1.3 | |
| `questions` | NEW (+ MIGRATE) | `src/lib/quiz/questions.ts` (15 hardcoded IQ questions) | AH-1.3 (schema), **AH-9.5 (data migration)** | The 15 IQ questions become rows in `questions`. `quick_test_config` references them via a link table. The hardcoded array in `src/lib/quiz/questions.ts` is **deleted** in AH-9.5. |
| `tests` | NEW | `test_sets` (parallel, different purpose) | AH-1.4 | COEXIST: subenai `test_sets` keeps powering `/test/zostav` composer; admin-hub `tests` powers `/app/tests/*` |
| `test_questions` | NEW | none | AH-1.4 | Link table between admin-hub `tests` and `questions` |
| `test_versions` | NEW | none | AH-1.4 | |
| `templates` | NEW | none | AH-1.3 | |
| `trainings` | NEW | none | AH-1.3 | |
| `respondents` | NEW | `attempts.respondent_*` inline columns (parallel, different purpose) | AH-1.4 | COEXIST: subenai inline columns on `attempts` keep powering IQ flow respondent capture; admin-hub `respondents` is a separate entity for `/app/tests/*` flow |
| `sessions` | NEW | `attempts` (parallel, different purpose) | AH-1.4 | COEXIST: `attempts` for `/test`; `sessions` for `/t/$shareId` |
| `session_answers` | NEW | `attempts.answers_jsonb` (inline, parallel) | AH-1.4 | COEXIST |
| `behavioral_events` | NEW | none | AH-1.4 | |
| `respondent_groups`, `group_assignments` | NEW | none | AH-1.4 | |
| `notifications` | NEW | none | AH-1.5 | |
| `audit_log` | NEW | none verified (search via `grep -i 'audit' supabase/migrations/`); confirm in AH-1.5 before commit | AH-1.5 | If subenai already has a partial audit table, AH-1.5 either extends it (with care for RLS) or namespaces the new one (`admin_audit_log`); document outcome in the AH-1.5 PR |
| `dsr_requests` | NEW | `purge_expired_respondent_pii` function exists but no DSR queue table — COEXIST | AH-1.5 | The function stays for `attempts` retention; `dsr_requests` is a new table for the user-submitted DSR flow |
| `reports` | NEW | none | AH-1.5 | |
| `cms_pages`, `cms_header`, `cms_footer`, `cms_navigation` | NEW | `SiteHeader.tsx` + `Footer.tsx` (code, hardcoded) | AH-1.6 (schema), AH-9.* (wiring) | COEXIST early, MIGRATE later: existing site header/footer remain code in AH-9. Future epic may migrate header/footer to CMS-driven content; out of scope here. |
| `share_card_config` | NEW | existing subenai share at `/podakovanie` and `/test/zostav` (parallel) | AH-1.6 | COEXIST per Q7 decision: admin-hub config governs ONLY `/app/tests/*` share via `/t/$shareId`. |
| `quick_test_config` | NEW | drives existing `/test` IQ page per Q6 Extend | AH-1.6 (schema), **AH-9.5 (wiring + data migration)** | Refactor: `/test` route reads questions, title, time limit, pass %, difficulty, visibility from this table. Toggle "Zobrazovať na webe" disables the route (404). |
| `support_config` | NEW | none | AH-1.6 | |
| `app_settings` | NEW | none | AH-1.6 | UI ported in AH-10.5; backend CRUD deferred |

---

## Data migrations (one-time scripts owned by feature epics)

| Migration | Source | Destination | Owning story |
|---|---|---|---|
| Move 15 IQ questions | `src/lib/quiz/questions.ts` | `public.questions` table rows + `public.quick_test_config` row + a `quick_test_questions` link table | AH-9.5 |
| (None for `attempts` → `sessions`) | — | — | — — historical IQ attempts stay in `attempts`; new `/t/$shareId` writes new `sessions` rows |
| (None for `test_sets` → `tests`) | — | — | — — composer-built test sets stay in `test_sets`; admin-hub `tests` is new |

---

## Production seeding rules

After AH-1 merges and the user runs the migration against production:

- **What gets inserted automatically**: nothing. AH-1 creates empty tables, RLS,
  triggers, functions. Production DB has zero rows in new admin-hub tables.
- **What the user inserts manually post-merge**:
  1. The admin bootstrap row (per AH-11.8 / Q10): one INSERT into `user_roles`.
  2. The IQ question migration (per AH-9.5): runs as part of the AH-9.5 epic
     deploy, not at AH-1 time.
- **What never gets inserted into production**:
  - `admin-hub/src/lib/admin-mock-data.ts` arrays — these are mock-store only,
    deleted in AH-11.6, never seeded into production Supabase.
  - `admin-hub/src/lib/user-mock-data.ts` arrays — same as above.

---

## What changes for AH-1 (DB schema epic)

AH-1 stays **purely structural** — tables, enums, RLS, triggers, functions. No
data migrations. No `INSERT` of fixture rows. Data movement (IQ questions →
`questions` table) is in AH-9.5.

---

## What changes for AH-9.5 (quick-test admin)

Grows significantly per Q6 Extend. New sub-story scope:

- AH-9.5.a — Data migration: read `src/lib/quiz/questions.ts`, INSERT 15 rows
  into `questions`, create one `quick_test_config` row referencing them via a
  link table, delete the hardcoded array.
- AH-9.5.b — Refactor `/test` route: read configuration from
  `quick_test_config` + joined questions, instead of importing the hardcoded
  array. Preserve scoring behavior bit-for-bit; e2e regression test.
- AH-9.5.c — Implement `/admin/quick-test` UI (the original admin-hub scope):
  toggle visibility, edit name/description/branža/time/pass %/difficulty/question
  selection. Visibility toggle off → `/test` returns 404.
- AH-9.5.d — e2e: toggle on → `/test` renders DB-driven content; toggle off →
  `/test` returns 404; existing `attempts` rows still queryable.

The owning AH-9.5 story file gets rewritten to reflect this expanded scope.

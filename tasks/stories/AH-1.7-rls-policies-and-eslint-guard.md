# AH-1.7 — RLS policies for all 29 tables + ESLint `no-restricted-imports` for `client.server`

## Goal
Apply Row-Level Security policies to every one of the 29 new tables, and add an
ESLint rule that prevents `supabaseAdmin` (`client.server`) from being imported
into non-server modules. This is the security-critical story of AH-1 — without it
all preceding tables are exposed.

## Acceptance criteria
- Every table created in AH-1.2 through AH-1.6 has at least one policy. Pattern:
  - Owner-owned tables (`tests`, `answer_sets`, `questions`, `templates`,
    `respondent_groups`, `notifications`): owner SELECT/INSERT/UPDATE/DELETE via
    `owner_id = auth.uid()`; admin via `has_role(auth.uid(), 'admin')`.
  - Identity tables (`profiles`, `user_roles`, `team_members`): user reads own
    row; admin reads all. `user_roles` INSERT/UPDATE/DELETE admin-only.
  - Public read with admin write (`categories`, `topics`, `trainings WHERE status =
    'published'`, `cms_pages WHERE status = 'published'`, all singleton config
    tables): anon SELECT permitted on published rows; admin-only writes.
  - Respondent flow tables (`respondents`, `sessions`, `session_answers`,
    `behavioral_events`): NO direct anon policies. All writes flow through server
    functions using `supabaseAdmin` (RLS bypass). Test-owner SELECT via
    `EXISTS (SELECT 1 FROM tests WHERE tests.id = sessions.test_id AND
    tests.owner_id = auth.uid())`.
  - Governance (`audit_log`, `dsr_requests`, `reports`): admin SELECT only; writes
    via server functions with `supabaseAdmin`.
- `pg_policies` cross-check query in the migration comment block listing all 29
  table names that must appear in `pg_policies` post-migration.
- ESLint rule in `eslint.config.js`: `no-restricted-imports` for
  `@/integrations/supabase/admin` (and `client.server`) — only allowed in files
  matching `**/*.server.ts` or files under `functions/**` or `src/routes/**` that
  the rule explicitly whitelists. Violations are errors, not warnings.
- `DEPLOY_SETUP.sql` mirrored.
- `npm run lint` 0/0; `tsc --noEmit` clean.
- `tasks/FEATURE_MAP-admin-hub.md` cross-reference: this story doesn't add new
  rows but should be referenced in the commit message; no FEATURE_MAP edit
  required.

## Implementation
Specific files:
- `/Users/lubomir/Desktop/subenai/supabase/migrations/20260517000000_admin_hub_schema.sql` (appends RLS section after AH-1.6's CMS+config block)
- `/Users/lubomir/Desktop/subenai/DEPLOY_SETUP.sql` (mirror)
- `/Users/lubomir/Desktop/subenai/eslint.config.js` (add `no-restricted-imports` rule)

## Tests
- Vitest at `tests/lib/supabase/rls-policies.test.ts`: for a representative subset
  (`tests`, `questions`, `sessions`, `audit_log`), call the anon client and assert
  the expected denial / allowance behavior using a mocked Supabase response.
- Integration spec at `e2e/integration/admin-hub/rls-anon-blocked.spec.ts`: as
  anon, attempt `SELECT * FROM tests`, `SELECT * FROM sessions`, `SELECT * FROM
  audit_log`; assert each returns zero rows (or PGRST error). Then as
  `supabaseAdmin` insert a published `cms_pages` row and assert anon can read it.
- data-testids: N/A.

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` — no new row; commit references this story
  in the message.
- `CHANGELOG.md` — N/A.
- privacy / cookies docs — N/A (no new data category; AH-7 owns the privacy entry).

## Code review
Fresh-context prompt:

> Review the RLS section in
> `/Users/lubomir/Desktop/subenai/supabase/migrations/20260517000000_admin_hub_schema.sql`
> and the ESLint rule added to
> `/Users/lubomir/Desktop/subenai/eslint.config.js`. Confirm: (1) every one of the
> 29 new tables (list at top of `tasks/FEATURE_MAP-admin-hub.md` Table 3) has at
> least one policy; (2) NO policy grants anon role direct write to `sessions`,
> `session_answers`, `respondents`, `behavioral_events`, `audit_log`,
> `dsr_requests`, or `user_roles`; (3) `has_role()` (defined in AH-1.1) is used
> consistently for admin checks — no inline `EXISTS (SELECT FROM user_roles ...)`
> in policies; (4) the ESLint rule blocks importing `@/integrations/supabase/admin`
> from any non-`*.server.ts` / non-`functions/**` file and runs at error
> severity; (5) `npm run lint` produces 0/0; (6) `git grep
> VITE_SUPABASE_SERVICE` in `src/` returns zero matches. Review only — do not
> modify code.

**Effort**: M
**Depends on**: AH-1.1, AH-1.2, AH-1.3, AH-1.4, AH-1.5, AH-1.6
**Source in admin-hub**: `docs/DATABASE.md` §3 (RLS — vzorové politiky)

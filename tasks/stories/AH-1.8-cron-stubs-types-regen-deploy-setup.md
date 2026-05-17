# AH-1.8 — Cron stubs, Supabase types regen, DEPLOY_SETUP.sql sync

## Goal
Close out AH-1 by adding the two commented `pg_cron` stubs (`anonymize-sessions`,
`dsr-sla-check`), regenerating `src/integrations/supabase/types.ts` from the
combined schema, and verifying `DEPLOY_SETUP.sql` is a faithful mirror of the
migration file.

## Acceptance criteria
- Migration's tail block adds two `pg_cron` calls, both commented:
  ```sql
  -- select cron.schedule('anonymize-sessions', '0 3 * * *', $$
  --   update public.sessions s set respondent_id = null
  --     from public.tests t
  --    where s.test_id = t.id
  --      and t.anonymize_after_days is not null
  --      and s.finished_at < now() - (t.anonymize_after_days || ' days')::interval
  --      and s.respondent_id is not null;
  -- $$);
  -- select cron.schedule('dsr-sla-check', '0 * * * *', $$ ... $$);
  ```
  with a comment explaining: `pg_cron` extension may not be enabled in the
  Supabase project; uncomment after `CREATE EXTENSION IF NOT EXISTS pg_cron;` is
  run manually.
- `src/integrations/supabase/types.ts` regenerated (`supabase gen types
  typescript --linked > src/integrations/supabase/types.ts`) and includes every
  new table, enum, and the `has_role` function.
- `DEPLOY_SETUP.sql` byte-identical (after normalizing whitespace) to the
  migration body, verified by a checksum step in the PR description or by an
  ad-hoc `diff` command captured in the commit message.
- `npm run lint` 0/0; `tsc --noEmit` clean; `npm test` green; `npm run build` ✓.
- `tasks/FEATURE_MAP-admin-hub.md` rows for the two cron stubs marked Done with
  commit SHA.

## Implementation
Specific files:
- `/Users/lubomir/Desktop/subenai/supabase/migrations/20260517000000_admin_hub_schema.sql` (appends cron stub tail after AH-1.7's RLS block)
- `/Users/lubomir/Desktop/subenai/DEPLOY_SETUP.sql` (final mirror sync)
- `/Users/lubomir/Desktop/subenai/src/integrations/supabase/types.ts` (regenerated)

## Tests
- Vitest at `tests/lib/supabase/types-regen.test.ts`: import the regenerated
  `Database` type; assert keys for each of the 29 new tables exist on
  `Database['public']['Tables']`; assert each of the 12 enums exists on
  `Database['public']['Enums']`.
- Integration spec at `e2e/integration/admin-hub/types-shape.spec.ts`: optional —
  type-level only, can be skipped if Vitest test covers it.
- data-testids: N/A.

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` cron-stub rows updated with commit SHA.
- `CHANGELOG.md` — N/A (no user-visible change).
- privacy / cookies docs — N/A.

## Code review
Fresh-context prompt:

> Review the cron-stub tail in
> `/Users/lubomir/Desktop/subenai/supabase/migrations/20260517000000_admin_hub_schema.sql`,
> the regenerated
> `/Users/lubomir/Desktop/subenai/src/integrations/supabase/types.ts`, and the
> final state of `/Users/lubomir/Desktop/subenai/DEPLOY_SETUP.sql`. Confirm: (1)
> both cron statements are commented; (2) the comment explains the manual
> `CREATE EXTENSION IF NOT EXISTS pg_cron;` prerequisite; (3) the regenerated
> `types.ts` contains entries for all 29 new tables and all 12 enums; (4)
> `DEPLOY_SETUP.sql` matches the migration body (compare with `diff -u`); (5)
> function-before-policy ordering is preserved (AH-1.1 function block first, RLS
> policies last); (6) ESLint 0/0; `npm test` green; `npm run build` ✓. Review
> only — do not modify code.

**Effort**: M
**Depends on**: AH-1.1, AH-1.2, AH-1.3, AH-1.4, AH-1.5, AH-1.6, AH-1.7
**Source in admin-hub**: `docs/DATABASE.md` §5 (Cron joby), §6 (Seeding poznámky)

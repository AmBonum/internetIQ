# AH-1.2 — Identity tables + `handle_new_user` trigger

## Goal
Land the auth-side tables (`profiles`, `user_roles`, `teams`, `team_members`) and the
`on_auth_user_created` trigger that seeds a `profiles` row whenever a new
`auth.users` entry is created. These are the gate for every authenticated route in
AH-3+.

## Acceptance criteria
- Tables created with columns matching `admin-hub/docs/DATABASE.md` §1 (identity):
  `profiles(id uuid PK FK auth.users(id) ON DELETE CASCADE, email, display_name,
  avatar_initials, created_at)`, `user_roles(id, user_id FK auth.users, role
  app_role, UNIQUE(user_id, role), created_at)`, `teams(id, name, owner_id FK
  auth.users, created_at)`, `team_members(id, team_id FK teams, user_id FK
  auth.users, role team_role, joined_at, UNIQUE(team_id, user_id))`.
- Role NEVER stored on `profiles` — enforced by absence of a `role` column there.
- Function `handle_new_user()` SECURITY DEFINER inserts `(id, email)` into
  `public.profiles`; trigger `on_auth_user_created AFTER INSERT ON auth.users FOR
  EACH ROW EXECUTE FUNCTION handle_new_user()`.
- Indexes: `team_members(user_id)`, `team_members(team_id)`.
- `DEPLOY_SETUP.sql` mirrored.
- `npm run lint` 0/0; `tsc --noEmit` clean.
- `tasks/FEATURE_MAP-admin-hub.md` rows for `profiles`, `user_roles`, `teams`,
  `team_members`, `handle_new_user` trigger marked Done with commit SHA.
- RLS is ENABLED on all 4 tables but no policies yet (added in AH-1.7); document
  this in the migration with a comment to prevent reviewer confusion.

## Implementation
Specific files:
- `/Users/lubomir/Desktop/subenai/supabase/migrations/20260517000000_admin_hub_schema.sql` (appends identity section after AH-1.1's enum + function block)
- `/Users/lubomir/Desktop/subenai/DEPLOY_SETUP.sql` (mirror)

## Tests
- Vitest at `tests/lib/supabase/identity-tables.test.ts`: verify typed select shapes
  exist for `profiles`, `user_roles`, `teams`, `team_members` against the
  regenerated types (regen lands in AH-1.8 — this test runs after that story).
- Integration spec at `e2e/integration/admin-hub/identity-trigger.spec.ts`: simulate
  a new auth user via `supabaseAdmin` and assert the `profiles` row is created.
- data-testids: N/A.

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` rows updated with commit SHA.
- `CHANGELOG.md` — N/A.
- privacy / cookies docs — N/A in this story (PII surface is documented in AH-7).

## Code review
Fresh-context prompt:

> Review the identity section in
> `/Users/lubomir/Desktop/subenai/supabase/migrations/20260517000000_admin_hub_schema.sql`.
> Confirm: (1) RLS is enabled on `profiles`, `user_roles`, `teams`, `team_members`;
> (2) no `role` column exists on `profiles` (role lives only in `user_roles`); (3)
> `handle_new_user()` is SECURITY DEFINER with explicit `SET search_path`; (4)
> trigger fires AFTER INSERT on `auth.users`, not BEFORE; (5) `DEPLOY_SETUP.sql`
> contains the same DDL; (6) ESLint 0/0. Review only — do not modify code.

**Effort**: M
**Depends on**: AH-1.1
**Source in admin-hub**: `docs/DATABASE.md` §1 (Identita a tímy)

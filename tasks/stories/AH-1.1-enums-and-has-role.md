# AH-1.1 — Enums and `has_role()` helper

## Goal
Establish the type foundation for the admin-hub schema: 12 Postgres enums and the
`has_role(uuid, app_role)` SECURITY DEFINER function. These are referenced by every
subsequent table and RLS policy, so they must land first and stay stable.

## Acceptance criteria
- All 12 enums created in `public` schema: `app_role`, `test_status`, `question_type`,
  `question_status`, `gdpr_purpose`, `session_status`, `training_status`,
  `report_reason`, `report_status`, `team_role`, `dsr_type`, `dsr_status`. Values
  match `admin-hub/docs/DATABASE.md` §2 verbatim.
- `has_role(_user_id uuid, _role app_role) RETURNS boolean` declared SECURITY DEFINER,
  STABLE, `SET search_path = public, pg_temp`. Returns `EXISTS (SELECT 1 FROM
  user_roles WHERE user_id = _user_id AND role = _role)`. Comment notes "must exist
  before any RLS policy referencing it".
- Function is the first DDL after the `CREATE TYPE` block; no RLS policies in this
  story (they ship in AH-1.7).
- `DEPLOY_SETUP.sql` mirrored.
- `npm run lint` 0/0; `tsc --noEmit` clean.
- `tasks/FEATURE_MAP-admin-hub.md` Table 3 rows for the 12 enums + `has_role` marked
  Done with commit SHA (see `git log`) in the same commit.

## Implementation
Specific files (absolute paths from repo root):
- `/Users/lubomir/Desktop/subenai/supabase/migrations/20260517000000_admin_hub_schema.sql` (creates the file; this story opens the migration with the enum + function section)
- `/Users/lubomir/Desktop/subenai/DEPLOY_SETUP.sql` (mirror)

## Tests
- Vitest at `tests/lib/supabase/has-role.test.ts`: mock the supabase client and verify
  the SQL `has_role(uuid, app_role)` is invoked with the expected arg shape from a
  typed wrapper. Pure SQL DDL is otherwise exercised by AH-1.2+ tables that depend
  on it.
- No integration spec (no user-visible surface).
- data-testids: N/A (migration story).

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` rows for 12 enums + `has_role` marked Done with
  commit SHA reference (see `git log`).
- `CHANGELOG.md` — N/A (no user-visible change).
- privacy / cookies docs — N/A.

## Code review
Fresh-context prompt (stands alone, no memory of this conversation):

> Review the new migration section at
> `/Users/lubomir/Desktop/subenai/supabase/migrations/20260517000000_admin_hub_schema.sql`
> and its mirror in `/Users/lubomir/Desktop/subenai/DEPLOY_SETUP.sql`. Confirm: (1)
> all 12 enum names and values match `admin-hub/docs/DATABASE.md` §2 verbatim; (2)
> `has_role()` is `SECURITY DEFINER`, `STABLE`, has explicit `SET search_path =
> public, pg_temp`; (3) the function is defined BEFORE any RLS policy that could
> reference it (function-before-policy ordering — AH-1.7 will add the policies);
> (4) no service_role secret appears anywhere in `src/`; (5) ESLint passes 0/0.
> Review only — do not modify code.

**Effort**: S
**Depends on**: —
**Source in admin-hub**: `docs/DATABASE.md` §2, `docs/INTEGRATION.md` (user-roles section)

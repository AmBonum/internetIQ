# AH-1.5 — Governance tables (notifications, audit_log, dsr_requests, reports)

## Goal
Land the four governance tables that back AH-7 (governance epic): user
notifications, the immutable audit log, the GDPR DSR queue, and the abuse-report
queue.

## Acceptance criteria
- Tables created per `admin-hub/docs/DATABASE.md` §1 (Notifikácie, audit, GDPR):
  - `notifications(id, user_id FK auth.users ON DELETE CASCADE, event_type, test_id
    FK tests, title, body, read_at, created_at)`
  - `audit_log(id, actor_id FK auth.users, actor_name, action text, target_type,
    target_id, pii_access bool DEFAULT false, details jsonb, at timestamptz DEFAULT
    now())`
  - `dsr_requests(id, requester_email, type dsr_type, status dsr_status DEFAULT
    'open', note, created_at DEFAULT now(), sla_due_at, resolved_at)`
  - `reports(id, target_type, target_id, reason report_reason, status report_status
    DEFAULT 'open', note, reporter_id FK auth.users, created_at DEFAULT now())`
- `audit_log` rows are immutable: trigger `forbid_audit_log_updates BEFORE UPDATE
  OR DELETE ON audit_log` raises an exception. Admin can SELECT only — INSERT goes
  through server functions with `supabaseAdmin`.
- Indexes: `notifications(user_id, read_at)`, `audit_log(actor_id, at DESC)`,
  `audit_log(target_type, target_id)`, `dsr_requests(status, sla_due_at)`.
- `dsr_requests.sla_due_at` defaults to `created_at + interval '72 hours'` (matches
  GDPR Art. 12 § 3 maximum-one-month obligation; subenai targets 72h per E12 SOP).
- RLS ENABLED on all 4 tables; policies in AH-1.7.
- `DEPLOY_SETUP.sql` mirrored.
- `npm run lint` 0/0; `tsc --noEmit` clean.
- `tasks/FEATURE_MAP-admin-hub.md` rows for all 4 tables marked Done with commit
  SHA.

## Implementation
Specific files:
- `/Users/lubomir/Desktop/subenai/supabase/migrations/20260517000000_admin_hub_schema.sql` (appends governance section after AH-1.4's test+session block)
- `/Users/lubomir/Desktop/subenai/DEPLOY_SETUP.sql` (mirror)

## Tests
- Vitest at `tests/lib/supabase/audit-log-immutable.test.ts`: verify the typed
  client surface treats `audit_log` as effectively append-only (no `.update()`
  helper exposed in `src/integrations/supabase/admin.ts`).
- Integration spec at `e2e/integration/admin-hub/audit-log-immutable.spec.ts`: via
  `supabaseAdmin`, attempt UPDATE on an `audit_log` row; assert the trigger
  raises.
- data-testids: N/A.

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` rows updated with commit SHA.
- `CHANGELOG.md` — N/A.
- privacy / cookies docs — N/A in this story (PII categories documented in AH-7).

## Code review
Fresh-context prompt:

> Review the governance section in
> `/Users/lubomir/Desktop/subenai/supabase/migrations/20260517000000_admin_hub_schema.sql`.
> Confirm: (1) `audit_log` UPDATE and DELETE are blocked by trigger; INSERT path
> documented as `supabaseAdmin`-only; (2) `dsr_requests.sla_due_at` default is 72h
> from `created_at`; (3) RLS enabled on all 4 tables; (4) `notifications` CASCADE
> on user delete (GDPR Art. 17); (5) `audit_log.pii_access` defaults to `false`;
> (6) ESLint 0/0. Review only — do not modify code.

**Effort**: M
**Depends on**: AH-1.1
**Source in admin-hub**: `docs/DATABASE.md` §1 (Notifikácie, audit, GDPR)

# AH-7.3 — Admin respondents list (`/admin/respondents`) with PII audit log

**Epic:** [AH-7 — Governance: reports, respondents, audit, DSR](../PLAN-2026-05-17-admin-hub-integration.md#epic-map)
**Effort:** `M`
**Priority:** `P1`
**Status:** Backlog
**Depends on:** AH-1, AH-3, AH-7.1
**Source in admin-hub:** `src/routes/admin/respondents.tsx`, `src/components/admin/RespondentsList.tsx`, `src/lib/admin/respondents.ts`

## Goal
Port the admin respondents list at `/admin/respondents`. Every load (page mount + filter change that re-queries) writes an `audit_log` row flagged `pii_access: true` via a server fn. This story stubs the audit insert against the mock store with a `__pii_access` flag; AH-11 swaps to the real `supabaseAdmin` insert.

## Acceptance criteria
- `cp admin-hub/src/routes/admin/respondents.tsx src/routes/admin/respondents.tsx` plus components.
- Path rewrites `@/lib/admin/store` → `@/lib/admin/mock-store`; `npx eslint --fix` on every copied file.
- `data-testid`: `respondents-list-table`, `respondents-list-row-${id}`, `respondents-list-filter-test`, `respondents-list-filter-status`, `respondents-list-search-input`, `respondents-list-empty-state`, `respondents-list-row-view-button-${id}`.
- Slovak strings in `src/i18n/locales/sk/governance.json` (filter labels, column headers, intake field display, empty state).
- Route guarded by `requireSupabaseAuth` + `requireAdmin`.
- **Every load writes an audit_log entry**: server fn `logRespondentsAccess` at `src/lib/admin/respondents.functions.ts` calls the mock store with `{ action: "respondents.list", pii_access: true, actor_id, target: "respondents" }`. Mock-flagged for this epic; AH-11 swaps to `supabaseAdmin.from("audit_log").insert(...)`.
- Vitest asserts the mock audit insert fires on render.
- FEATURE_MAP-admin-hub.md row `routes/admin/respondents.tsx` marked Done with `see git log`.
- CHANGELOG entry (user-visible: no — admin-only).

## Implementation
- `cp admin-hub/src/routes/admin/respondents.tsx src/routes/admin/respondents.tsx`.
- `cp admin-hub/src/components/admin/RespondentsList.tsx src/components/admin/RespondentsList.tsx`.
- `cp admin-hub/src/lib/admin/respondents.ts src/lib/admin/respondents.ts`; rewrite imports.
- New: `src/lib/admin/respondents.functions.ts` — `createServerFn` skeleton that invokes mock store `auditLog.append({ pii_access: true, ... })`. TODO comment: AH-11 swap to `supabaseAdmin`.
- Extend `src/i18n/locales/sk/governance.json` with respondents-list keys.

## Tests
- Vitest `tests/routes/admin/respondents.test.tsx` — happy path (seeded list renders, search filters rows), edge (empty list renders empty state).
- Vitest `tests/lib/admin/respondents-functions.test.ts` — assert mock audit insert with `pii_access: true` happens on every list invocation; assert actor id is propagated.
- Vitest `tests/components/admin/RespondentsList.test.tsx` — column rendering + row view button fires navigation callback.
- Playwright `e2e/specs/admin/respondents-list.spec.ts` with POM `e2e/poms/admin/RespondentsListPage.ts` — admin loads list, filters by test, opens a row detail.

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` — mark AH-7.3 row Done (`see git log`).
- `CHANGELOG.md` — entry (user-visible: no).
- privacy/cookies — N/A (categories covered by AH-7.1).

## Code review (fresh context)
Reviewer verifies: every page load triggers exactly one audit insert with `pii_access: true`; mock-flagged with explicit TODO referencing AH-11; data-testids present; ESLint 0/0; route is admin-guarded; no client-side leak of full PII rows beyond what the list intentionally renders. Files: `src/routes/admin/respondents.tsx`, `src/components/admin/RespondentsList.tsx`, `src/lib/admin/respondents.ts`, `src/lib/admin/respondents.functions.ts`, `src/i18n/locales/sk/governance.json`.

# AH-7.2 — Admin reports queue (`/admin/reports`)

**Epic:** [AH-7 — Governance: reports, respondents, audit, DSR](../PLAN-2026-05-17-admin-hub-integration.md#epic-map)
**Effort:** `M`
**Priority:** `P1`
**Status:** Backlog
**Depends on:** AH-1, AH-3, AH-7.1 (consent bump must merge first)
**Source in admin-hub:** `src/routes/admin/reports.tsx`, `src/components/admin/ReportsQueue.tsx`, `src/lib/admin/reports.ts`

## Goal
Port the admin content-moderation reports queue at `/admin/reports`. Lists user-submitted reports against tests/questions/content, with filters (status, reason, age) and bulk resolve actions. Wired to the ported mock admin store; AH-11 swaps to Supabase.

## Acceptance criteria
- `cp admin-hub/src/routes/admin/reports.tsx src/routes/admin/reports.tsx` plus dependent components.
- Path rewrites `@/lib/admin/store` → `@/lib/admin/mock-store`; `@/lib/admin-mock-data` → `@/lib/admin/mock-data`.
- `npx eslint --fix` on every ported file.
- `data-testid`: `reports-queue-table`, `reports-queue-row-${id}`, `reports-queue-filter-status`, `reports-queue-filter-reason`, `reports-queue-row-resolve-button-${id}`, `reports-queue-empty-state`.
- Slovak strings in `src/i18n/locales/sk/governance.json` (report reasons: spam, hate, copyright, factually-wrong, other; statuses: open, in-review, resolved, dismissed) and registered in `src/i18n/resources.ts`.
- Route guarded by `requireSupabaseAuth` + `requireAdmin` (added in AH-3); anon hits the layout's 401 redirect.
- Empty-state copy when no reports.
- FEATURE_MAP-admin-hub.md row `routes/admin/reports.tsx` marked Done with `see git log`.
- CHANGELOG entry (user-visible: no — admin-only).
- Mock-only: actions call mock store methods; AH-11 wires real Supabase + audit log row.

## Implementation
- `cp admin-hub/src/routes/admin/reports.tsx src/routes/admin/reports.tsx`.
- `cp admin-hub/src/components/admin/ReportsQueue.tsx src/components/admin/ReportsQueue.tsx` (and any sub-components referenced).
- `cp admin-hub/src/lib/admin/reports.ts src/lib/admin/reports.ts`; rewrite imports to `@/lib/admin/mock-store`.
- `npx eslint --fix` on every copied file.
- Extend `src/i18n/locales/sk/governance.json` (created in AH-7.1) with report-queue keys.

## Tests
- Vitest `tests/routes/admin/reports.test.tsx` — happy (seeded queue renders rows), edge (empty queue renders empty state), filter behaviour (filter by status narrows rows).
- Vitest `tests/components/admin/ReportsQueue.test.tsx` — resolve action invokes mock store method; bulk select works.
- Playwright `e2e/specs/admin/reports-queue.spec.ts` with POM `e2e/poms/admin/ReportsQueuePage.ts` — admin loads queue, filters by status, resolves one row.

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` — mark AH-7.2 row Done (`see git log`).
- `CHANGELOG.md` — entry (user-visible: no).
- privacy/cookies — N/A (no new PII surface beyond AH-7.1).

## Code review (fresh context)
Reviewer verifies: route is guarded; mock-only (no Supabase); every listed data-testid present; i18n keys registered; ESLint 0/0; no PII rendered without an audit hook (note: this story does not list PII, but reviewer must confirm). Files: `src/routes/admin/reports.tsx`, `src/components/admin/ReportsQueue.tsx`, `src/lib/admin/reports.ts`, `src/i18n/locales/sk/governance.json`, `src/i18n/resources.ts`.

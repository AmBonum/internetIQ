# AH-7.4 — Admin audit log viewer (`/admin/audit`) — read-only

**Epic:** [AH-7 — Governance: reports, respondents, audit, DSR](../PLAN-2026-05-17-admin-hub-integration.md#epic-map)
**Effort:** `M`
**Priority:** `P1`
**Status:** Backlog
**Depends on:** AH-1, AH-3, AH-7.1
**Source in admin-hub:** `src/routes/admin/audit.tsx`, `src/components/admin/AuditLogViewer.tsx`, `src/lib/admin/audit.ts`

## Goal
Port the read-only audit log viewer at `/admin/audit`. Renders a paginated table of `audit_log` rows from the mock store with filters by actor, action, target, pii_access flag, and time range. No write actions on this page; AH-11 swaps the data source to Supabase.

## Acceptance criteria
- `cp admin-hub/src/routes/admin/audit.tsx src/routes/admin/audit.tsx` plus components.
- Path rewrites `@/lib/admin/store` → `@/lib/admin/mock-store`; `npx eslint --fix` on every copied file.
- `data-testid`: `audit-log-table`, `audit-log-row-${id}`, `audit-log-filter-actor`, `audit-log-filter-action`, `audit-log-filter-pii`, `audit-log-filter-date-from`, `audit-log-filter-date-to`, `audit-log-empty-state`, `audit-log-pagination-next`, `audit-log-pagination-prev`.
- Slovak strings in `src/i18n/locales/sk/governance.json` (action labels, column headers, pii flag label, empty state) and registered in `src/i18n/resources.ts`.
- Route guarded by `requireSupabaseAuth` + `requireAdmin`.
- Read-only: no edit/delete actions on rows; copy-to-clipboard for row JSON allowed.
- Pagination via mock store cursor; AH-11 swaps to real cursor.
- FEATURE_MAP-admin-hub.md row `routes/admin/audit.tsx` marked Done with `see git log`.
- CHANGELOG entry (user-visible: no — admin-only).

## Implementation
- `cp admin-hub/src/routes/admin/audit.tsx src/routes/admin/audit.tsx`.
- `cp admin-hub/src/components/admin/AuditLogViewer.tsx src/components/admin/AuditLogViewer.tsx`.
- `cp admin-hub/src/lib/admin/audit.ts src/lib/admin/audit.ts`; rewrite imports.
- `npx eslint --fix` on every copied file.
- Extend `src/i18n/locales/sk/governance.json` with audit-viewer keys.

## Tests
- Vitest `tests/routes/admin/audit.test.tsx` — happy (seeded log renders rows), edge (empty log renders empty state), filter behaviour narrows rows by actor + action + pii flag.
- Vitest `tests/components/admin/AuditLogViewer.test.tsx` — pagination next/prev advances cursor; copy-to-clipboard fires.
- Vitest assertion that the viewer itself does NOT write an audit entry on render (it's a meta-view; writing here would loop).
- Playwright `e2e/specs/admin/audit-log.spec.ts` with POM `e2e/poms/admin/AuditLogPage.ts` — admin loads viewer, filters by `pii_access: true`, paginates.

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` — mark AH-7.4 row Done (`see git log`).
- `CHANGELOG.md` — entry (user-visible: no).
- privacy/cookies — N/A.

## Code review (fresh context)
Reviewer verifies: read-only (no mutations); the viewer does NOT log its own access (would cause infinite loop on AH-11); every data-testid present; admin guard active; ESLint 0/0; mock-only with TODO for AH-11. Files: `src/routes/admin/audit.tsx`, `src/components/admin/AuditLogViewer.tsx`, `src/lib/admin/audit.ts`, `src/i18n/locales/sk/governance.json`.

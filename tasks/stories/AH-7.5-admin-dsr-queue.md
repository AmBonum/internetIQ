# AH-7.5 — Admin DSR processing queue (`/admin/dsr`) with SLA timer

**Epic:** [AH-7 — Governance: reports, respondents, audit, DSR](../PLAN-2026-05-17-admin-hub-integration.md#epic-map)
**Effort:** `M`
**Priority:** `P1`
**Status:** Backlog
**Depends on:** AH-1, AH-3, AH-7.1
**Source in admin-hub:** `src/routes/admin/dsr.tsx`, `src/components/admin/DsrQueue.tsx`, `src/lib/admin/dsr.ts`

## Goal
Port the admin DSR (Data Subject Request) processing queue at `/admin/dsr`. Lists DSR submissions from `/app/legal/dsr` with status (open, in-progress, completed, rejected), DSR type, requestor, and a GDPR-mandated 30-day SLA timer per row. Admin can pick up, resolve, or reject. Mock-only; AH-11 wires Supabase + audit insert per action.

## Acceptance criteria
- `cp admin-hub/src/routes/admin/dsr.tsx src/routes/admin/dsr.tsx` plus components.
- Path rewrites `@/lib/admin/store` → `@/lib/admin/mock-store`; `npx eslint --fix` on every copied file.
- `data-testid`: `dsr-queue-table`, `dsr-queue-row-${id}`, `dsr-queue-filter-status`, `dsr-queue-filter-type`, `dsr-queue-row-sla-badge-${id}`, `dsr-queue-row-resolve-button-${id}`, `dsr-queue-row-reject-button-${id}`, `dsr-queue-empty-state`.
- SLA badge variants: `ok` (>14 days remaining), `warn` (3–14 days), `overdue` (<3 days or past 30-day deadline). Verbatim Slovak labels in `governance.json`.
- Slovak strings in `src/i18n/locales/sk/governance.json` (DSR types, statuses, SLA labels, action button copy) and registered in `src/i18n/resources.ts`.
- Route guarded by `requireSupabaseAuth` + `requireAdmin`.
- Resolve/reject actions call mock store methods; each appends a mock audit_log entry (no `pii_access` flag here — the act of resolving is not PII access; the row content is though, so reviewer must confirm rendering rules).
- FEATURE_MAP-admin-hub.md row `routes/admin/dsr.tsx` marked Done with `see git log`.
- CHANGELOG entry (user-visible: no — admin-only).
- Mock-only; AH-11 swaps to Supabase.

## Implementation
- `cp admin-hub/src/routes/admin/dsr.tsx src/routes/admin/dsr.tsx`.
- `cp admin-hub/src/components/admin/DsrQueue.tsx src/components/admin/DsrQueue.tsx`.
- `cp admin-hub/src/lib/admin/dsr.ts src/lib/admin/dsr.ts`; rewrite imports.
- `npx eslint --fix` on every copied file.
- SLA computation helper at `src/lib/admin/dsr-sla.ts` — pure function taking `(submittedAt: Date, now: Date) => "ok" | "warn" | "overdue"`.
- Extend `src/i18n/locales/sk/governance.json` with DSR-queue keys.

## Tests
- Vitest `tests/lib/admin/dsr-sla.test.ts` — boundaries (day 0, day 16, day 27, day 30, day 31) map to the correct badge variant; covers expired SLA edge case.
- Vitest `tests/routes/admin/dsr.test.tsx` — happy (seeded queue renders), edge (empty queue renders empty state, expired-SLA row renders `overdue` badge).
- Vitest `tests/components/admin/DsrQueue.test.tsx` — resolve + reject invoke mock store methods; each appends a mock audit entry.
- Playwright `e2e/specs/admin/dsr-queue.spec.ts` with POM `e2e/poms/admin/DsrQueuePage.ts` — admin loads queue, filters by status, resolves one open request.

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` — mark AH-7.5 row Done (`see git log`).
- `CHANGELOG.md` — entry (user-visible: no).
- privacy/cookies — N/A (categories covered by AH-7.1).

## Code review (fresh context)
Reviewer verifies: SLA helper is pure and tested at boundaries; admin guard active; data-testids present; ESLint 0/0; resolve/reject paths each append a mock audit entry; mock-only with TODO for AH-11 to wire real Supabase + audit insert. Files: `src/routes/admin/dsr.tsx`, `src/components/admin/DsrQueue.tsx`, `src/lib/admin/dsr.ts`, `src/lib/admin/dsr-sla.ts`, `src/i18n/locales/sk/governance.json`.

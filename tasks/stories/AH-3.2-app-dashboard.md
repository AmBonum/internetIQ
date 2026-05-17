# AH-3.2 — App dashboard (`/app`) with StatCard tiles

**Epic:** [AH-3 — App shell + auth guard](../PLAN-2026-05-17-admin-hub-integration.md#epic-map)
**Effort:** `S`
**Priority:** `P1`
**Status:** 🟡 Ready
**Depends on:** AH-3.1
**Source in admin-hub:** `routes/app.index.tsx`, `components/admin/StatCard.tsx`

## Goal
Port the authenticated landing page at `/app` with StatCard summary tiles fed by the platform mock store.

## Acceptance criteria
- `src/routes/app.index.tsx` renders under the `app` layout (inherits `requireSupabaseAuth`).
- `src/components/admin/StatCard.tsx` ported and reused for tiles (tests count, sessions count, respondents count, completion rate).
- All ported files run through `npx eslint --fix`.
- Every tile + page element has a `data-testid`: `app-dashboard-stat-card-tests`, `app-dashboard-stat-card-sessions`, `app-dashboard-stat-card-respondents`, `app-dashboard-stat-card-completion`, `app-dashboard-page-header`.
- Slovak strings extracted to `src/i18n/locales/sk/app-shell.json` (existing namespace).
- Reads from `src/lib/platform/mock-store.ts` only; zero Supabase calls.
- FEATURE_MAP-admin-hub.md status for `routes/app.index.tsx` and `components/admin/StatCard.tsx` marked Done with `see git log`.
- CHANGELOG entry under upcoming version (user-visible: yes).

## Implementation
- `cp admin-hub/src/routes/app.index.tsx src/routes/app.index.tsx`
- `cp admin-hub/src/components/admin/StatCard.tsx src/components/admin/StatCard.tsx`
- Path rewrites: `@/lib/platform/store` → `@/lib/platform/mock-store`; `@/lib/user-mock-data` → `@/lib/platform/mock-user-data`.
- `npx eslint --fix` per copied file.
- Append i18n keys to `src/i18n/locales/sk/app-shell.json` under a `dashboard.*` subtree.

## Tests
- Vitest at `tests/routes/app/index.test.tsx` — happy render with seeded mock store; empty-state edge when store returns zero tests.
- Vitest at `tests/components/admin/StatCard.test.tsx` — renders label + value + trend.
- Playwright spec `e2e/specs/app/dashboard.spec.ts` with POM `e2e/poms/app/AppDashboardPage.ts`. POM-only locators; assert all four StatCards visible.

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` — mark relevant rows Done with `see git log`.
- `CHANGELOG.md` — entry under upcoming version (user-visible: yes).
- `privacy/cookies` — N/A.

## Code review (fresh context)
Reviewer verifies: no Supabase calls; data-testids present; i18n keys present; mock store import path is `@/lib/platform/mock-store`; StatCard is generic (no admin-specific copy). Files: `src/routes/app.index.tsx`, `src/components/admin/StatCard.tsx`, `src/i18n/locales/sk/app-shell.json`.

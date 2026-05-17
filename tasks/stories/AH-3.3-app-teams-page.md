# AH-3.3 — Teams page (`/app/teams`)

**Epic:** [AH-3 — App shell + auth guard](../PLAN-2026-05-17-admin-hub-integration.md#epic-map)
**Effort:** `S`
**Priority:** `P2`
**Status:** 🟡 Ready
**Depends on:** AH-3.1
**Source in admin-hub:** `routes/app.teams.tsx`

## Goal
Port the team management page where the authenticated user views their teams, member roles, and invite stubs.

## Acceptance criteria
- `src/routes/app.teams.tsx` renders under the `app` layout (inherits `requireSupabaseAuth`).
- All ported files run through `npx eslint --fix`.
- Data-testids: `app-teams-page-header`, `app-teams-list`, `app-teams-row-${teamId}`, `app-teams-invite-button`, `app-teams-member-row-${memberId}`, `app-teams-empty-state`.
- Slovak strings extracted to `src/i18n/locales/sk/app-shell.json` under `teams.*`.
- Reads from `src/lib/platform/mock-store.ts` only; zero Supabase calls.
- FEATURE_MAP-admin-hub.md status for `routes/app.teams.tsx` marked Done with `see git log`.
- CHANGELOG entry under upcoming version (user-visible: yes).

## Implementation
- `cp admin-hub/src/routes/app.teams.tsx src/routes/app.teams.tsx`
- Path rewrites: `@/lib/platform/store` → `@/lib/platform/mock-store`; `@/lib/user-mock-data` → `@/lib/platform/mock-user-data`.
- `npx eslint --fix src/routes/app.teams.tsx`.
- Append `teams.*` keys to `src/i18n/locales/sk/app-shell.json`.

## Tests
- Vitest at `tests/routes/app/teams.test.tsx` — happy render with seeded teams; empty-state edge when mock store returns no teams.
- Playwright spec `e2e/specs/app/teams.spec.ts` with POM `e2e/poms/app/AppTeamsPage.ts`. POM-only locators; assert list visible and invite button enabled.

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` — mark relevant row Done with `see git log`.
- `CHANGELOG.md` — entry under upcoming version (user-visible: yes).
- `privacy/cookies` — N/A.

## Code review (fresh context)
Reviewer verifies: no Supabase calls; data-testids present; i18n keys present; no `client.server` imported. File: `src/routes/app.teams.tsx`.

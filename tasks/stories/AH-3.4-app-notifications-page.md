# AH-3.4 — Notifications page (`/app/notifications`)

**Epic:** [AH-3 — App shell + auth guard](../PLAN-2026-05-17-admin-hub-integration.md#epic-map)
**Effort:** `S`
**Priority:** `P2`
**Status:** 🟡 Ready
**Depends on:** AH-3.1
**Source in admin-hub:** `routes/app.notifications.tsx`

## Goal
Port the in-app notifications inbox: list of unread/read notifications, mark-as-read and mark-all-as-read controls, fed by the platform mock store.

## Acceptance criteria
- `src/routes/app.notifications.tsx` renders under the `app` layout (inherits `requireSupabaseAuth`).
- All ported files run through `npx eslint --fix`.
- Data-testids: `app-notifications-page-header`, `app-notifications-list`, `app-notifications-row-${id}`, `app-notifications-mark-read-${id}`, `app-notifications-mark-all`, `app-notifications-empty-state`, `app-notifications-filter-unread`.
- Slovak strings extracted to `src/i18n/locales/sk/app-shell.json` under `notifications.*`.
- Reads from `src/lib/platform/mock-store.ts` only; zero Supabase calls.
- FEATURE_MAP-admin-hub.md status for `routes/app.notifications.tsx` marked Done with `see git log`.
- CHANGELOG entry under upcoming version (user-visible: yes).

## Implementation
- `cp admin-hub/src/routes/app.notifications.tsx src/routes/app.notifications.tsx`
- Path rewrites: `@/lib/platform/store` → `@/lib/platform/mock-store`; `@/lib/user-mock-data` → `@/lib/platform/mock-user-data`.
- `npx eslint --fix src/routes/app.notifications.tsx`.
- Append `notifications.*` keys to `src/i18n/locales/sk/app-shell.json`.

## Tests
- Vitest at `tests/routes/app/notifications.test.tsx` — happy render with mixed read/unread; empty-state edge.
- Playwright spec `e2e/specs/app/notifications.spec.ts` with POM `e2e/poms/app/AppNotificationsPage.ts`. POM-only locators; verify mark-as-read flips state.

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` — mark relevant row Done with `see git log`.
- `CHANGELOG.md` — entry under upcoming version (user-visible: yes).
- `privacy/cookies` — N/A.

## Code review (fresh context)
Reviewer verifies: no Supabase calls; data-testids present; i18n keys present; mock store path correct. File: `src/routes/app.notifications.tsx`.

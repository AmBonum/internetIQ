# AH-3.6 — Account profile (`/app/account/profile`)

**Epic:** [AH-3 — App shell + auth guard](../PLAN-2026-05-17-admin-hub-integration.md#epic-map)
**Effort:** `S`
**Priority:** `P1`
**Status:** 🟡 Ready
**Depends on:** AH-3.1
**Source in admin-hub:** `routes/app.account.profile.tsx`

## Goal
Port the authenticated user's profile editor (display name, locale, avatar URL stub) backed by the platform mock store.

## Acceptance criteria
- `src/routes/app.account.profile.tsx` renders under the `app` layout (inherits `requireSupabaseAuth`).
- All ported files run through `npx eslint --fix`.
- Data-testids: `app-account-profile-page-header`, `app-account-profile-form`, `app-account-profile-name-input`, `app-account-profile-locale-select`, `app-account-profile-avatar-url-input`, `app-account-profile-submit`, `app-account-profile-toast-success`.
- Slovak strings extracted to `src/i18n/locales/sk/app-shell.json` under `account.profile.*`.
- Writes go to `src/lib/platform/mock-store.ts` `updateProfile()`; zero Supabase calls.
- FEATURE_MAP-admin-hub.md status for `routes/app.account.profile.tsx` marked Done with `see git log`.
- CHANGELOG entry under upcoming version (user-visible: yes).

## Implementation
- `cp admin-hub/src/routes/app.account.profile.tsx src/routes/app.account.profile.tsx`
- Path rewrites: `@/lib/platform/store` → `@/lib/platform/mock-store`; `@/lib/user-mock-data` → `@/lib/platform/mock-user-data`.
- `npx eslint --fix src/routes/app.account.profile.tsx`.
- Append `account.profile.*` keys to `src/i18n/locales/sk/app-shell.json`.

## Tests
- Vitest at `tests/routes/app/account.profile.test.tsx` — happy render with seeded profile; edit + submit calls mock store updater; validation edge (empty name → error visible).
- Playwright spec `e2e/specs/app/account-profile.spec.ts` with POM `e2e/poms/app/AppAccountProfilePage.ts`. POM-only locators; verify submit shows toast.

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` — mark relevant row Done with `see git log`.
- `CHANGELOG.md` — entry under upcoming version (user-visible: yes).
- `privacy/cookies` — N/A (mock-only; AH-11 wires real profile updates).

## Code review (fresh context)
Reviewer verifies: no Supabase calls; data-testids present; i18n keys present; updates flow through mock store only. File: `src/routes/app.account.profile.tsx`.

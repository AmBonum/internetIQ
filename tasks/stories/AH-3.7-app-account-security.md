# AH-3.7 — Account security (`/app/account/security`) — UI only

**Epic:** [AH-3 — App shell + auth guard](../PLAN-2026-05-17-admin-hub-integration.md#epic-map)
**Effort:** `S`
**Priority:** `P2`
**Status:** 🟡 Ready
**Depends on:** AH-3.1
**Source in admin-hub:** `routes/app.account.security.tsx`

## Goal
Port the account security page (change password stub, 2FA toggle UI, active sessions list) — UI only. **2FA backend is deferred** per PLAN-2026-05-17 Out-of-Scope §6. The 2FA toggle must render with a disabled state and a tooltip explaining the backend is not yet wired.

## Acceptance criteria
- `src/routes/app.account.security.tsx` renders under the `app` layout (inherits `requireSupabaseAuth`).
- All ported files run through `npx eslint --fix`.
- 2FA toggle is visible but disabled; tooltip / inline copy says backend deferred. **Call out in PR description.**
- Change-password form is UI-only; submit shows a "not yet available" toast.
- Data-testids: `app-account-security-page-header`, `app-account-security-password-form`, `app-account-security-current-password`, `app-account-security-new-password`, `app-account-security-submit-password`, `app-account-security-2fa-toggle`, `app-account-security-2fa-tooltip`, `app-account-security-sessions-list`, `app-account-security-revoke-${sessionId}`.
- Slovak strings extracted to `src/i18n/locales/sk/app-shell.json` under `account.security.*`.
- Reads/writes use `src/lib/platform/mock-store.ts` only; zero Supabase calls.
- FEATURE_MAP-admin-hub.md status for `routes/app.account.security.tsx` marked Done with `see git log`.
- CHANGELOG entry under upcoming version (user-visible: yes; note 2FA deferred).

## Implementation
- `cp admin-hub/src/routes/app.account.security.tsx src/routes/app.account.security.tsx`
- Path rewrites: `@/lib/platform/store` → `@/lib/platform/mock-store`; `@/lib/user-mock-data` → `@/lib/platform/mock-user-data`.
- `npx eslint --fix src/routes/app.account.security.tsx`.
- Append `account.security.*` keys (including 2FA-deferred copy) to `src/i18n/locales/sk/app-shell.json`.

## Tests
- Vitest at `tests/routes/app/account.security.test.tsx` — renders form + 2FA toggle disabled; submit shows "not yet available" toast; sessions list renders from mock store.
- Playwright spec `e2e/specs/app/account-security.spec.ts` with POM `e2e/poms/app/AppAccountSecurityPage.ts`. POM-only locators; verify 2FA toggle is disabled and tooltip visible on hover.

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` — mark relevant row Done with `see git log`.
- `CHANGELOG.md` — entry under upcoming version (user-visible: yes); explicit "2FA UI present, backend deferred" note.
- `privacy/cookies` — N/A.

## Code review (fresh context)
Reviewer verifies: 2FA toggle disabled with backend-deferred copy; no Supabase calls; data-testids present; i18n keys present; password submit is a no-op toast, not a real API call. File: `src/routes/app.account.security.tsx`.

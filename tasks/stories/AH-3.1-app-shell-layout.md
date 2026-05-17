# AH-3.1 — App shell layout, sidebar, page header, mock store wire-up

**Epic:** [AH-3 — App shell + auth guard](../PLAN-2026-05-17-admin-hub-integration.md#epic-map)
**Effort:** `M`
**Priority:** `P1`
**Status:** 🟡 Ready
**Depends on:** AH-1.1, AH-2.1, AH-2.2
**Source in admin-hub:** `routes/__root.tsx`, `routes/app.tsx`, `components/app/page-header.tsx`, `components/user/AppShell.tsx`, `components/admin/ConfirmDialog.tsx`, `lib/admin/store.ts`, `lib/platform/store.ts`, `lib/admin-mock-data.ts`, `lib/user-mock-data.ts`

## Goal
Port the authenticated user-app shell (`/app/*` layout, sidebar, page header, confirm dialog) plus the ported mock stores that all subsequent AH-3 through AH-10 stories depend on. Wire the layout to `requireSupabaseAuth` so unauthenticated visitors are bounced before any child route renders.

## Acceptance criteria
- `src/routes/app.tsx` layout route mounts `AppShell` and applies `requireSupabaseAuth` middleware; unauthenticated request returns 401 redirect to `/prihlasit`.
- `src/routes/__root.tsx` extended (NOT replaced) to register the new `app` segment without breaking existing `/` routes.
- Mock stores ported and renamed: `src/lib/admin/mock-store.ts`, `src/lib/platform/mock-store.ts`, `src/lib/admin/mock-data.ts`, `src/lib/platform/mock-user-data.ts`. No Supabase queries; AH-11 replaces these.
- All ported files run through `npx eslint --fix` (Lovable printWidth differs from subenai).
- Every interactive/semantic DOM element carries a `data-testid`: `app-shell-sidebar`, `app-shell-sidebar-link-dashboard`, `app-shell-sidebar-link-tests`, `app-shell-sidebar-link-teams`, `app-shell-page-header-title`, `app-shell-confirm-dialog-root`, `app-shell-confirm-dialog-confirm`, `app-shell-confirm-dialog-cancel`.
- Slovak strings extracted to `src/i18n/locales/sk/app-shell.json` and registered in `src/i18n/resources.ts`.
- FEATURE_MAP-admin-hub.md status column for affected rows marked Done with `see git log` in same commit.
- CHANGELOG entry under upcoming version (user-visible: yes).

## Implementation
- Copy: `cp admin-hub/src/components/app/page-header.tsx src/components/app/page-header.tsx`; same for `components/user/AppShell.tsx`, `components/admin/ConfirmDialog.tsx`, `routes/app.tsx`.
- Rename copies: `lib/admin/store.ts` → `src/lib/admin/mock-store.ts`; `lib/platform/store.ts` → `src/lib/platform/mock-store.ts`; `lib/admin-mock-data.ts` → `src/lib/admin/mock-data.ts`; `lib/user-mock-data.ts` → `src/lib/platform/mock-user-data.ts`.
- Path rewrites in every copied file: `@/lib/admin/store` → `@/lib/admin/mock-store`; `@/lib/platform/store` → `@/lib/platform/mock-store`; `@/lib/admin-mock-data` → `@/lib/admin/mock-data`; `@/lib/user-mock-data` → `@/lib/platform/mock-user-data`.
- `npx eslint --fix` per copied file.
- New: `src/integrations/supabase/auth-middleware.ts` exporting `requireSupabaseAuth` (TanStack `createServerFn` middleware reading session cookie; throws 401 if missing).
- New: `src/i18n/locales/sk/app-shell.json` (sidebar nav labels, account menu, confirm dialog defaults) + register in `src/i18n/resources.ts`.

## Tests
- Vitest at `tests/components/user/AppShell.test.tsx` — renders shell with seeded mock store; sidebar links visible; toggling collapse persists in local state.
- Vitest at `tests/components/admin/ConfirmDialog.test.tsx` — confirm + cancel paths fire callbacks.
- Vitest at `tests/integrations/supabase/auth-middleware.test.ts` — mocked session present → passes; missing → throws 401.
- Playwright spec `e2e/specs/app/shell.spec.ts` with POM `e2e/poms/app/AppShellPage.ts`. POM-only locators per CLAUDE.md. Covers sidebar visibility, link navigation, mobile drawer toggle.

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` — mark all AH-3.1 rows Done with `see git log`.
- `CHANGELOG.md` — entry under upcoming version (user-visible: yes).
- `privacy/cookies` — N/A (mock-only, no new PII surface).

## Code review (fresh context)
Reviewer verifies: no Supabase calls in this epic (mock only); every listed data-testid present; i18n keys present and registered; `requireSupabaseAuth` applied at layout level; no `client.server` imported outside `*.server.ts`; mock store import paths use the renamed `mock-*` files. Files: `src/routes/app.tsx`, `src/components/user/AppShell.tsx`, `src/components/app/page-header.tsx`, `src/components/admin/ConfirmDialog.tsx`, `src/integrations/supabase/auth-middleware.ts`, `src/lib/admin/mock-store.ts`, `src/lib/platform/mock-store.ts`, `src/lib/admin/mock-data.ts`, `src/lib/platform/mock-user-data.ts`, `src/i18n/locales/sk/app-shell.json`, `src/i18n/resources.ts`.

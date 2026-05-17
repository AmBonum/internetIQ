# AH-3.5 — Help page (`/app/help`)

**Epic:** [AH-3 — App shell + auth guard](../PLAN-2026-05-17-admin-hub-integration.md#epic-map)
**Effort:** `XS`
**Priority:** `P2`
**Status:** 🟡 Ready
**Depends on:** AH-3.1
**Source in admin-hub:** `routes/app.help.tsx`

## Goal
Port the authenticated help / support page with FAQ accordion and contact CTA.

## Acceptance criteria
- `src/routes/app.help.tsx` renders under the `app` layout (inherits `requireSupabaseAuth`).
- All ported files run through `npx eslint --fix`.
- Data-testids: `app-help-page-header`, `app-help-faq-list`, `app-help-faq-item-${index}`, `app-help-contact-cta`, `app-help-search-input`.
- Slovak strings extracted to `src/i18n/locales/sk/app-shell.json` under `help.*` (FAQ entries and CTA labels).
- No data fetched from any store; static FAQ array lives next to the route.
- FEATURE_MAP-admin-hub.md status for `routes/app.help.tsx` marked Done with `see git log`.
- CHANGELOG entry under upcoming version (user-visible: yes).

## Implementation
- `cp admin-hub/src/routes/app.help.tsx src/routes/app.help.tsx`
- `npx eslint --fix src/routes/app.help.tsx`.
- Append `help.*` keys to `src/i18n/locales/sk/app-shell.json`.

## Tests
- Vitest at `tests/routes/app/help.test.tsx` — renders FAQ list; clicking an item expands it; search filter narrows visible items.
- Playwright spec `e2e/specs/app/help.spec.ts` with POM `e2e/poms/app/AppHelpPage.ts`. POM-only locators; verify FAQ accordion behavior.

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` — mark relevant row Done with `see git log`.
- `CHANGELOG.md` — entry under upcoming version (user-visible: yes).
- `privacy/cookies` — N/A.

## Code review (fresh context)
Reviewer verifies: no Supabase calls; data-testids present; i18n keys present; route inherits middleware. File: `src/routes/app.help.tsx`.

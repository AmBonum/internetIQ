# AH-9.5 — Admin quick-test config (`/admin/quick-test`)

**Epic:** AH-9 — CMS + site header / footer / sitemap
**Effort:** M
**Status:** Backlog

## Goal
Port the admin-hub quick-test config editor — a single-row config (number of
questions, time limit, displayed CTA copy, redirect on completion). Mock-only
in this epic.

## OPEN QUESTION FOR USER
Per `tasks/PLAN-2026-05-17-admin-hub-integration.md` open question #6:
**does the admin-hub `quick_test_config` replace, extend, or coexist with the
existing subenai public `/test` (15-question IQ test)?** This story assumes
**coexist** (separate config row read only by an admin-hub-style quick-test
preview surface in AH-10/11; the existing `/test` route is untouched). Confirm
with user before merging — if "replace" is chosen, this story must add a
migration plan for the existing `attempts` flow.

## Acceptance criteria
- Route `/admin/quick-test` exposes a single-form editor against
  `cms_quick_test_config` (mock store).
- Save persists to mock store; lint 0/0.
- All ported files have `npx eslint --fix` applied.
- data-testids: `quick-test-config-form`, `quick-test-config-form-save`,
  `quick-test-config-question-count`, `quick-test-config-time-limit`,
  `quick-test-config-cta-label`, `quick-test-config-redirect-url`.
- Slovak strings extended in `src/i18n/locales/sk/cms.json` (keys `quickTest.*`).
- FEATURE_MAP-admin-hub.md row `AH-9.5` marked `Done` with commit SHA.
- CHANGELOG entry (user-visible: yes).
- Existing public `/test` route untouched (verified by spot-running its tests).
- Mock-only in this epic; AH-11 wires real Supabase.

## Implementation
- `cp admin-hub/src/routes/admin/quick-test.tsx src/routes/admin/quick-test.tsx`
- Path rewrites: `@/lib/admin/cms-store` → `@/lib/admin/cms-mock-store`;
  `@/lib/admin/cms-hooks` stays.
- `npx eslint --fix src/routes/admin/quick-test.tsx`
- Extend `src/i18n/locales/sk/cms.json`.
- Add test-ids listed above.

## Tests
- Vitest: `tests/routes/admin/quick-test.test.tsx`
  - Renders all form fields with seeded values.
  - Save calls mock-store update.
  - Validation rejects negative numbers and empty CTA.

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` — mark row Done (`see git log`).
- `CHANGELOG.md` — user-visible entry.
- `src/content/legal/*.md` — N/A.

## Code review
Fresh-context: no Supabase imports; test-ids present; i18n under `cms`; existing
public `/test` and `attempts` writes unaffected; mock-store only.

**Effort:** M
**Depends on:** AH-1 (DB types), AH-3, AH-10
**Source in admin-hub:** `src/routes/admin/quick-test.tsx`

# AH-5.1 — User tests list (`/app/tests`)

## Goal
Port the creator-facing tests index — searchable, filterable list of tests the
authenticated user owns, with status badges and entry points to the editor and the
new-test wizard.

## Acceptance criteria
- Route `src/routes/app.tests.index.tsx` ported. Reads from
  `@/lib/platform/mock-store`.
- Search input, status filter (draft / published / archived), branch filter; clear
  filters button.
- Empty state when filters return zero rows; `data-testid="tests-list-empty-state"`.
- Every interactive element has a `data-testid`: `tests-list-search-input`,
  `tests-list-status-filter`, `tests-list-branch-filter`,
  `tests-list-new-test-button`, `tests-list-row-${id}`,
  `tests-list-row-open-${id}`, `tests-list-row-share-${id}`,
  `tests-list-clear-filters-button`.
- Status uses the shared `StatusBadge` component.
- Slovak strings extracted to `src/i18n/locales/sk/tests.json` and registered in
  `src/i18n/resources.ts` + `src/i18n/types.d.ts`.
- `npx eslint --fix` applied; lint 0/0.
- `tasks/FEATURE_MAP-admin-hub.md` row for `app.tests.index.tsx` marked Done with
  `see git log`.
- `CHANGELOG.md` entry — user-visible: yes.
- No Supabase imports.

## Implementation
Specific files (absolute paths from repo root):
- `cp /Users/lubomir/Desktop/subenai/admin-hub/src/routes/app.tests.index.tsx /Users/lubomir/Desktop/subenai/src/routes/app.tests.index.tsx`
- Path rewrites: `@/lib/platform/store` → `@/lib/platform/mock-store`;
  `@/lib/user-mock-data` → `@/lib/platform/mock-user-data`.
- New: `/Users/lubomir/Desktop/subenai/src/i18n/locales/sk/tests.json` + register.
- `npx eslint --fix /Users/lubomir/Desktop/subenai/src/routes/app.tests.index.tsx`.

## Tests
- Vitest at `tests/routes/app/tests-list.test.tsx` — happy render with seeded tests,
  status filter narrows rows, empty state appears on no matches, "Nový test" button
  links to `/app/tests/new`.
- No Playwright spec at this stage.

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` — row marked Done with `see git log`.
- `CHANGELOG.md` — user-visible entry.
- privacy / cookies — N/A.

## Code review
Fresh-context prompt:
> Review the diff for AH-5.1. Confirm: (1) imports point at `mock-` prefixed paths;
> (2) every interactive element + empty state has a `data-testid`; (3) Slovak
> strings live in `src/i18n/locales/sk/tests.json` only; (4) `tests.json` registered
> in `resources.ts` and `types.d.ts`; (5) no Supabase calls. Review only — no edits.

**Effort**: S
**Depends on**: AH-1, AH-3, AH-4.1 (StatusBadge)
**Source in admin-hub**: `routes/app.tests.index.tsx`

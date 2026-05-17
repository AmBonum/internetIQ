# AH-5.7 — Admin tests list (`/admin/tests`)

## Goal
Port the admin-side tests index: platform admin sees every test across creators,
with status, difficulty, branch filters, and entry points to the admin test editor
(AH-5.8).

## Acceptance criteria
- Route `src/routes/admin/tests.tsx` ported. Reads from `@/lib/admin/mock-store`.
- Filters: status, difficulty, branch, owner; clear-filters button.
- Bulk-select with a header checkbox; bulk-delete via `ConfirmDialog`.
- Every interactive element has a `data-testid`: `admin-tests-list-search`,
  `admin-tests-list-status-filter`, `admin-tests-list-difficulty-filter`,
  `admin-tests-list-branch-filter`, `admin-tests-list-owner-filter`,
  `admin-tests-list-clear-filters`, `admin-tests-list-row-${id}`,
  `admin-tests-list-row-checkbox-${id}`, `admin-tests-list-select-all-checkbox`,
  `admin-tests-list-bulk-delete-button`, `admin-tests-row-open-${id}`,
  `admin-tests-row-delete-${id}`, `admin-tests-list-empty-state`.
- Slovak strings extracted to `src/i18n/locales/sk/tests.json`.
- `npx eslint --fix` applied; lint 0/0.
- `tasks/FEATURE_MAP-admin-hub.md` row for `admin/tests.tsx` marked Done with
  `see git log`.
- `CHANGELOG.md` entry — user-visible: yes.
- No Supabase imports.

## Implementation
Specific files (absolute paths from repo root):
- `cp /Users/lubomir/Desktop/subenai/admin-hub/src/routes/admin/tests.tsx /Users/lubomir/Desktop/subenai/src/routes/admin/tests.tsx`
- Path rewrites: `@/lib/admin/store` → `@/lib/admin/mock-store`;
  `@/lib/admin-mock-data` → `@/lib/admin/mock-data`.
- `npx eslint --fix /Users/lubomir/Desktop/subenai/src/routes/admin/tests.tsx`.

## Tests
- Vitest at `tests/routes/admin/tests-list.test.tsx` — happy render, filter
  combinations narrow rows, select-all + bulk-delete clears the store; edge:
  empty state.
- No Playwright spec at this stage.

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` — row marked Done with `see git log`.
- `CHANGELOG.md` — user-visible entry.
- privacy / cookies — N/A.

## Code review
Fresh-context prompt:
> Review the diff for AH-5.7. Confirm: (1) imports use `mock-` prefixed paths;
> (2) every filter, row, and bulk-action element has a `data-testid`; (3) bulk
> delete uses `ConfirmDialog`; (4) Slovak strings in `src/i18n/locales/sk/tests.json`;
> (5) no Supabase calls. Review only — no edits.

**Effort**: S
**Depends on**: AH-1, AH-3, AH-4.1
**Source in admin-hub**: `routes/admin/tests.tsx`

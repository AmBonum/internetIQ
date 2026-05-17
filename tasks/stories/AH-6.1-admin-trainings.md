# AH-6.1 — Admin trainings list + TrainingEditor (`/admin/trainings`)

## Goal
Port the admin trainings surface: list with CRUD and duplicate, plus the
`TrainingEditor` (modules, status, branch / topic association).

## Acceptance criteria
- Route `src/routes/admin/trainings.tsx` ported.
- Component `src/components/admin/TrainingEditor.tsx` ported.
- CRUD against `@/lib/admin/mock-store`. Duplicate creates a new entry with
  ` (copy)` suffix.
- Every interactive element has a `data-testid`: `admin-trainings-list-search`,
  `admin-trainings-list-new-button`, `admin-trainings-list-row-${id}`,
  `admin-trainings-row-edit-${id}`, `admin-trainings-row-duplicate-${id}`,
  `admin-trainings-row-delete-${id}`, `training-editor-title-input`,
  `training-editor-status-select`, `training-editor-branch-select`,
  `training-editor-topic-multiselect`, `training-editor-save-button`,
  `training-editor-cancel-button`, `training-editor-module-row-${idx}`,
  `training-editor-module-add-button`,
  `training-editor-module-remove-${idx}`,
  `admin-trainings-list-empty-state`.
- Delete uses `ConfirmDialog`.
- Slovak strings extracted to `src/i18n/locales/sk/categories.json` and registered
  in `src/i18n/resources.ts` + `src/i18n/types.d.ts`.
- `npx eslint --fix` on every ported file; lint 0/0.
- `tasks/FEATURE_MAP-admin-hub.md` rows for `admin/trainings.tsx` and
  `TrainingEditor.tsx` marked Done with `see git log`.
- `CHANGELOG.md` entry — user-visible: yes.
- No Supabase imports.

## Implementation
Specific files (absolute paths from repo root):
- `cp /Users/lubomir/Desktop/subenai/admin-hub/src/routes/admin/trainings.tsx /Users/lubomir/Desktop/subenai/src/routes/admin/trainings.tsx`
- `cp /Users/lubomir/Desktop/subenai/admin-hub/src/components/admin/TrainingEditor.tsx /Users/lubomir/Desktop/subenai/src/components/admin/TrainingEditor.tsx`
- Path rewrites: `@/lib/admin/store` → `@/lib/admin/mock-store`;
  `@/lib/admin-mock-data` → `@/lib/admin/mock-data`.
- New: `/Users/lubomir/Desktop/subenai/src/i18n/locales/sk/categories.json` + register.
- `npx eslint --fix` on the two new files.

## Tests
- Vitest at `tests/routes/admin/trainings.test.tsx` — happy render, create training
  via editor, duplicate row, delete via `ConfirmDialog`; edge: empty state.
- Vitest at `tests/components/admin/training-editor.test.tsx` — validation: empty
  title disables save.
- No Playwright spec at this stage.

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` — rows marked Done with `see git log`.
- `CHANGELOG.md` — user-visible entry.
- privacy / cookies — N/A.

## Code review
Fresh-context prompt:
> Review the diff for AH-6.1. Confirm: (1) imports use `mock-` prefixed paths;
> (2) every interactive element including each module row has a `data-testid`;
> (3) delete uses `ConfirmDialog`; (4) `categories.json` registered in
> `resources.ts` and `types.d.ts`; (5) no Supabase calls. Review only — no edits.

**Effort**: M
**Depends on**: AH-1, AH-3
**Source in admin-hub**: `routes/admin/trainings.tsx`,
`components/admin/TrainingEditor.tsx`

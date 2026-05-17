# AH-6.2 — Admin categories list + CategoryMultiSelect (`/admin/categories`)

## Goal
Port the admin categories surface (branches + topics CRUD via dialog) and the
reusable `CategoryMultiSelect` component used by question / test / training
editors.

## Acceptance criteria
- Route `src/routes/admin/categories.tsx` ported. CRUD against
  `@/lib/admin/mock-store`.
- Component `src/components/admin/CategoryMultiSelect.tsx` ported. Renders a
  searchable multi-select grouped by branch.
- Categories page has two sections: branches and topics, each with add / edit /
  delete via dialog.
- Every interactive element has a `data-testid`:
  `admin-categories-branches-list`, `admin-categories-topics-list`,
  `admin-categories-new-branch-button`, `admin-categories-new-topic-button`,
  `admin-categories-branch-row-${id}`, `admin-categories-topic-row-${id}`,
  `admin-categories-branch-row-edit-${id}`,
  `admin-categories-branch-row-delete-${id}`,
  `admin-categories-topic-row-edit-${id}`,
  `admin-categories-topic-row-delete-${id}`,
  `category-dialog-name-input`, `category-dialog-branch-select`,
  `category-dialog-save-button`, `category-dialog-cancel-button`,
  `category-multiselect-root`, `category-multiselect-search-input`,
  `category-multiselect-option-${id}`, `category-multiselect-clear-button`,
  `category-multiselect-selected-tag-${id}`.
- Delete uses `ConfirmDialog`; deleting a branch with topics is blocked with an
  inline error.
- Slovak strings extracted to `src/i18n/locales/sk/categories.json`.
- `npx eslint --fix` on every ported file; lint 0/0.
- `tasks/FEATURE_MAP-admin-hub.md` rows for `admin/categories.tsx` and
  `CategoryMultiSelect.tsx` marked Done with `see git log`.
- `CHANGELOG.md` entry — user-visible: yes.
- No Supabase imports.

## Implementation
Specific files (absolute paths from repo root):
- `cp /Users/lubomir/Desktop/subenai/admin-hub/src/routes/admin/categories.tsx /Users/lubomir/Desktop/subenai/src/routes/admin/categories.tsx`
- `cp /Users/lubomir/Desktop/subenai/admin-hub/src/components/admin/CategoryMultiSelect.tsx /Users/lubomir/Desktop/subenai/src/components/admin/CategoryMultiSelect.tsx`
- Path rewrites: `@/lib/admin/store` → `@/lib/admin/mock-store`;
  `@/lib/admin-mock-data` → `@/lib/admin/mock-data`.
- `npx eslint --fix` on the two new files.

## Tests
- Vitest at `tests/routes/admin/categories.test.tsx` — happy render of seeded
  branches + topics, create branch via dialog, create topic linked to a branch,
  delete topic via `ConfirmDialog`; edge: attempting to delete a branch that has
  topics surfaces the inline error.
- Vitest at `tests/components/admin/category-multiselect.test.tsx` — search
  narrows options, selecting and clearing toggles `aria-selected` / the selected
  tag list.
- No Playwright spec at this stage.

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` — rows marked Done with `see git log`.
- `CHANGELOG.md` — user-visible entry.
- privacy / cookies — N/A.

## Code review
Fresh-context prompt:
> Review the diff for AH-6.2. Confirm: (1) imports use `mock-` prefixed paths;
> (2) every interactive element including dialog inputs and each option /
> selected tag has a `data-testid`; (3) the branch-with-topics delete guard is
> implemented; (4) Slovak strings in `src/i18n/locales/sk/categories.json`;
> (5) no Supabase calls. Review only — no edits.

**Effort**: M
**Depends on**: AH-1, AH-3
**Source in admin-hub**: `routes/admin/categories.tsx`,
`components/admin/CategoryMultiSelect.tsx`

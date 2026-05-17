# AH-5.8 — Admin test editor (`/admin/tests/$testId`) + TestEditor

## Goal
Port the admin-side test editor and the `TestEditor` component: question add /
remove / reorder, branch / difficulty / settings, status workflow
(draft / published / archived).

## Acceptance criteria
- Route `src/routes/admin/tests.$testId.tsx` ported.
- Component `src/components/admin/TestEditor.tsx` ported.
- Drag-to-reorder is mocked (use simple up/down arrows for now — keyboard a11y).
- Unsaved-changes guard via `ConfirmDialog` on navigation when dirty.
- Every interactive element has a `data-testid`: `admin-test-editor-title-input`,
  `admin-test-editor-description-input`, `admin-test-editor-status-select`,
  `admin-test-editor-difficulty-select`, `admin-test-editor-branch-select`,
  `admin-test-editor-save-button`, `admin-test-editor-publish-button`,
  `admin-test-editor-archive-button`, `admin-test-editor-back-button`,
  `admin-test-editor-question-row-${idx}`,
  `admin-test-editor-question-row-up-${idx}`,
  `admin-test-editor-question-row-down-${idx}`,
  `admin-test-editor-question-row-remove-${idx}`,
  `admin-test-editor-add-question-button`, `admin-test-editor-not-found`.
- Slovak strings extracted to `src/i18n/locales/sk/tests.json`.
- `npx eslint --fix` on every ported file; lint 0/0.
- `tasks/FEATURE_MAP-admin-hub.md` rows for `admin/tests.$testId.tsx` and
  `TestEditor.tsx` marked Done with `see git log`.
- `CHANGELOG.md` entry — user-visible: yes.
- No Supabase imports.

## Implementation
Specific files (absolute paths from repo root):
- `cp /Users/lubomir/Desktop/subenai/admin-hub/src/routes/admin/tests.$testId.tsx /Users/lubomir/Desktop/subenai/src/routes/admin/tests.$testId.tsx`
- `cp /Users/lubomir/Desktop/subenai/admin-hub/src/components/admin/TestEditor.tsx /Users/lubomir/Desktop/subenai/src/components/admin/TestEditor.tsx`
- Path rewrites: `@/lib/admin/store` → `@/lib/admin/mock-store`;
  `@/lib/admin-mock-data` → `@/lib/admin/mock-data`.
- `npx eslint --fix` on the two new files.

## Tests
- Vitest at `tests/routes/admin/test-editor.test.tsx` — happy render of a seeded
  test, edit title, reorder questions via up/down, save persists; edge: unknown
  `$testId` renders the not-found state.
- Playwright spec at `e2e/specs/admin/test-editor.spec.ts` with `test.step()` per
  phase: load → edit → reorder → publish → reload-and-verify. POM at
  `e2e/poms/admin/TestEditorPage.ts`. POM-only locators.

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` — rows marked Done with `see git log`.
- `CHANGELOG.md` — user-visible entry.
- privacy / cookies — N/A.

## Code review
Fresh-context prompt:
> Review the diff for AH-5.8. Confirm: (1) imports use `mock-` prefixed paths;
> (2) every interactive element has a `data-testid` per the convention;
> (3) reorder controls are keyboard-accessible (up/down arrow buttons, not
> drag-only); (4) Playwright spec uses POM-only locators with `test.step()`;
> (5) Slovak strings extracted to `src/i18n/locales/sk/tests.json`; (6) no
> Supabase calls. Review only — no edits.

**Effort**: M
**Depends on**: AH-1, AH-3, AH-4.1, AH-5.7
**Source in admin-hub**: `routes/admin/tests.$testId.tsx`,
`components/admin/TestEditor.tsx`

# AH-4.5 — Admin answer-set editor (`/admin/answer-sets/$setId`)

## Goal
Port the admin answer-set editor page and the `AnswerSetEditor` component:
two-column (Correct / Incorrect) editor with add/remove/reorder per column, plus a
link to questions that reuse the set.

## Acceptance criteria
- Route `src/routes/admin/answer-sets.$setId.tsx` ported.
- Component `src/components/admin/AnswerSetEditor.tsx` ported.
- Add / remove / edit-inline on both columns; mutations persist to
  `@/lib/admin/answer-sets-mock-store`.
- Unsaved-changes guard: navigating away with dirty state triggers `ConfirmDialog`.
- Every interactive element has a `data-testid`:
  `answer-set-editor-title-input`, `answer-set-editor-save-button`,
  `answer-set-editor-correct-add-button`, `answer-set-editor-incorrect-add-button`,
  `answer-set-editor-correct-row-${idx}`, `answer-set-editor-incorrect-row-${idx}`,
  `answer-set-editor-correct-row-delete-${idx}`,
  `answer-set-editor-incorrect-row-delete-${idx}`,
  `answer-set-editor-correct-row-input-${idx}`,
  `answer-set-editor-incorrect-row-input-${idx}`,
  `answer-set-editor-back-button`, `answer-set-editor-questions-link`.
- Slovak strings extracted to `src/i18n/locales/sk/questions.json`.
- `npx eslint --fix` on every ported file; lint 0/0.
- `tasks/FEATURE_MAP-admin-hub.md` rows for `admin/answer-sets.$setId.tsx` and
  `AnswerSetEditor.tsx` marked Done with `see git log`.
- `CHANGELOG.md` entry — user-visible: yes.
- No Supabase imports.

## Implementation
Specific files (absolute paths from repo root):
- `cp /Users/lubomir/Desktop/subenai/admin-hub/src/routes/admin/answer-sets.$setId.tsx /Users/lubomir/Desktop/subenai/src/routes/admin/answer-sets.$setId.tsx`
- `cp /Users/lubomir/Desktop/subenai/admin-hub/src/components/admin/AnswerSetEditor.tsx /Users/lubomir/Desktop/subenai/src/components/admin/AnswerSetEditor.tsx`
- Path rewrites: `@/lib/admin/store` → `@/lib/admin/mock-store`;
  `@/lib/admin/answer-sets-store` → `@/lib/admin/answer-sets-mock-store`.
- `npx eslint --fix` on the two new files.

## Tests
- Vitest at `tests/routes/admin/answer-set-editor.test.tsx` — happy render of a
  seeded set, add a correct row, delete an incorrect row, save persists; edge:
  unknown `$setId` renders not-found.
- Playwright spec at `e2e/specs/admin/answer-set-editor.spec.ts` wrapping each
  action in `test.step()`: load → edit → save → reload-and-verify. POM at
  `e2e/poms/admin/AnswerSetEditorPage.ts`. POM-only locators.
- Validation edge: save with empty title surfaces an inline error.

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` — rows marked Done with `see git log`.
- `CHANGELOG.md` — user-visible entry.
- privacy / cookies — N/A.

## Code review
Fresh-context prompt:
> Review the diff for AH-4.5. Confirm: (1) all data imports use `mock-` prefixed
> paths; (2) every interactive element including each row's input + delete has a
> `data-testid` per the convention; (3) the Playwright spec uses POM-only locators
> with `test.step()` for each phase; (4) Slovak strings extracted to
> `src/i18n/locales/sk/questions.json`; (5) no Supabase calls anywhere.
> Review only — no edits.

**Effort**: M
**Depends on**: AH-1, AH-3, AH-4.4
**Source in admin-hub**: `routes/admin/answer-sets.$setId.tsx`,
`components/admin/AnswerSetEditor.tsx`

# AH-5.4 — User audiences (`/app/audiences`)

## Goal
Port the respondent-groups CRUD page where creators manage tagged audience cohorts
their tests can target. Email-import / invite flow is deferred to a later epic
(see PLAN out-of-scope); the row UI for it ships disabled.

## Acceptance criteria
- Route `src/routes/app.audiences.tsx` ported. CRUD against
  `@/lib/platform/mock-store`.
- Tag input supports add/remove tags per group.
- Bulk email import row is rendered but the action button is disabled with a
  tooltip explaining "Pripravujeme" (deferred).
- Every interactive element has a `data-testid`: `audiences-list-row-${id}`,
  `audiences-new-group-button`, `audiences-row-edit-${id}`,
  `audiences-row-delete-${id}`, `audiences-editor-name-input`,
  `audiences-editor-tag-input`, `audiences-editor-tag-remove-${tag}`,
  `audiences-editor-save-button`, `audiences-editor-cancel-button`,
  `audiences-import-emails-button`.
- Slovak strings extracted to `src/i18n/locales/sk/tests.json`.
- `npx eslint --fix` applied; lint 0/0.
- `tasks/FEATURE_MAP-admin-hub.md` row for `app.audiences.tsx` marked Done with
  `see git log`.
- `CHANGELOG.md` entry — user-visible: yes.
- No Supabase imports.

## Implementation
Specific files (absolute paths from repo root):
- `cp /Users/lubomir/Desktop/subenai/admin-hub/src/routes/app.audiences.tsx /Users/lubomir/Desktop/subenai/src/routes/app.audiences.tsx`
- Path rewrites: `@/lib/platform/store` → `@/lib/platform/mock-store`;
  `@/lib/user-mock-data` → `@/lib/platform/mock-user-data`.
- `npx eslint --fix /Users/lubomir/Desktop/subenai/src/routes/app.audiences.tsx`.

## Tests
- Vitest at `tests/routes/app/audiences.test.tsx` — happy render with seeded
  groups, create a group via the editor, delete a group via `ConfirmDialog`; edge:
  the import-emails button is disabled.
- No Playwright spec at this stage.

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` — row marked Done with `see git log`.
- `CHANGELOG.md` — user-visible entry.
- privacy / cookies — N/A (audience metadata only; respondent PII is governed by AH-7).

## Code review
Fresh-context prompt:
> Review the diff for AH-5.4. Confirm: (1) imports use `mock-` prefixed paths;
> (2) every interactive element has a `data-testid`; (3) the import-emails button
> is disabled and has a tooltip explaining the deferred status; (4) Slovak strings
> in `src/i18n/locales/sk/tests.json`; (5) no Supabase calls. Review only — no edits.

**Effort**: S
**Depends on**: AH-1, AH-3
**Source in admin-hub**: `routes/app.audiences.tsx`

# AH-4.4 — Admin answer-sets list + answer-sets-store

## Goal
Port the admin answer-sets index and its dedicated mock store. Admin can search,
duplicate, and delete answer sets that questions reuse.

## Acceptance criteria
- Route `src/routes/admin/answer-sets.tsx` ported.
- New file `src/lib/admin/answer-sets-mock-store.ts` ported from
  `admin-hub/src/lib/admin/answer-sets-store.ts`. File name carries the `mock-`
  prefix so the AH-11 grep guard catches any leakage into the production bundle.
- Search input filters by title; duplicate and delete actions wire to the mock store
  via `useSyncExternalStore`.
- Every interactive element has a `data-testid`: `answer-sets-list-search`,
  `answer-sets-list-new-button`, `answer-sets-list-row-${id}`,
  `answer-sets-row-duplicate-${id}`, `answer-sets-row-delete-${id}`,
  `answer-sets-row-open-${id}`.
- Delete uses the existing `ConfirmDialog` (`data-testid="confirm-dialog-root"`,
  `confirm-dialog-confirm`, `confirm-dialog-cancel`).
- Slovak strings extracted to `src/i18n/locales/sk/questions.json`.
- `npx eslint --fix` on every ported file; lint 0/0.
- `tasks/FEATURE_MAP-admin-hub.md` rows for `admin/answer-sets.tsx` and
  `lib/admin/answer-sets-store.ts` marked Done with `see git log`.
- `CHANGELOG.md` entry — user-visible: yes.
- No Supabase imports.

## Implementation
Specific files (absolute paths from repo root):
- `cp /Users/lubomir/Desktop/subenai/admin-hub/src/routes/admin/answer-sets.tsx /Users/lubomir/Desktop/subenai/src/routes/admin/answer-sets.tsx`
- `cp /Users/lubomir/Desktop/subenai/admin-hub/src/lib/admin/answer-sets-store.ts /Users/lubomir/Desktop/subenai/src/lib/admin/answer-sets-mock-store.ts`
- Path rewrites: `@/lib/admin/store` → `@/lib/admin/mock-store`;
  `@/lib/admin/answer-sets-store` → `@/lib/admin/answer-sets-mock-store`;
  `@/lib/admin-mock-data` → `@/lib/admin/mock-data`.
- `npx eslint --fix` on the two new files.

## Tests
- Vitest at `tests/routes/admin/answer-sets-list.test.tsx` — happy render + edges:
  empty state (store returns `[]`), search filter narrows visible rows, delete via
  confirm dialog removes the row.
- Vitest at `tests/lib/admin/answer-sets-mock-store.test.ts` — direct store unit
  test: `createSet`, `duplicateSet`, `deleteSet`, `getById` behave correctly and
  subscribers are notified.
- No Playwright spec at this stage.

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` — rows marked Done with `see git log`.
- `CHANGELOG.md` — user-visible entry.
- privacy / cookies — N/A.

## Code review
Fresh-context prompt:
> Review the diff for AH-4.4. Confirm: (1) the new store file name is
> `answer-sets-mock-store.ts` (the `mock-` prefix is required for AH-11's grep
> guard); (2) all data imports point at `mock-` prefixed paths; (3) every
> interactive element has a `data-testid`; (4) delete uses `ConfirmDialog`;
> (5) Slovak strings in `src/i18n/locales/sk/questions.json`; (6) no Supabase calls.
> Review only — no edits.

**Effort**: S
**Depends on**: AH-1, AH-3
**Source in admin-hub**: `routes/admin/answer-sets.tsx`, `lib/admin/answer-sets-store.ts`

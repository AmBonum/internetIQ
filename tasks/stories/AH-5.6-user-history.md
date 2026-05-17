# AH-5.6 — User history (`/app/history`)

## Goal
Port the creator-facing history page: chronological list of test sessions and test
versions, with filters by test, by date range, and by event type.

## Acceptance criteria
- Route `src/routes/app.history.tsx` ported. Reads from
  `@/lib/platform/mock-store`.
- Combined timeline of `sessions` (mock) and `test_versions` (mock); each entry
  shows actor, action, timestamp, target test.
- Filter controls: test select, date-range picker, event-type filter
  (session / version / status-change).
- Every interactive element has a `data-testid`: `history-test-filter`,
  `history-date-from`, `history-date-to`, `history-event-type-filter`,
  `history-clear-filters-button`, `history-row-${id}`,
  `history-empty-state`.
- Slovak strings extracted to `src/i18n/locales/sk/tests.json`.
- `npx eslint --fix` applied; lint 0/0.
- `tasks/FEATURE_MAP-admin-hub.md` row for `app.history.tsx` marked Done with
  `see git log`.
- `CHANGELOG.md` entry — user-visible: yes.
- No Supabase imports.

## Implementation
Specific files (absolute paths from repo root):
- `cp /Users/lubomir/Desktop/subenai/admin-hub/src/routes/app.history.tsx /Users/lubomir/Desktop/subenai/src/routes/app.history.tsx`
- Path rewrites: `@/lib/platform/store` → `@/lib/platform/mock-store`;
  `@/lib/user-mock-data` → `@/lib/platform/mock-user-data`.
- `npx eslint --fix /Users/lubomir/Desktop/subenai/src/routes/app.history.tsx`.

## Tests
- Vitest at `tests/routes/app/history.test.tsx` — happy render with seeded timeline,
  applying each filter narrows the visible rows; edge: empty state when filters
  exclude everything.
- No Playwright spec at this stage.

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` — row marked Done with `see git log`.
- `CHANGELOG.md` — user-visible entry.
- privacy / cookies — N/A (the history view does not surface respondent PII —
  respondent details live behind AH-7).

## Code review
Fresh-context prompt:
> Review the diff for AH-5.6. Confirm: (1) imports use `mock-` prefixed paths;
> (2) every filter and row has a `data-testid`; (3) no respondent PII fields are
> shown in the row template; (4) Slovak strings in `src/i18n/locales/sk/tests.json`;
> (5) no Supabase calls. Review only — no edits.

**Effort**: S
**Depends on**: AH-1, AH-3, AH-5.1
**Source in admin-hub**: `routes/app.history.tsx`

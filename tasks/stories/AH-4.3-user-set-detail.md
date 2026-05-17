# AH-4.3 — User set detail (`/app/sets/$setId`)

## Goal
Port the creator-facing read-only view of a single answer set, accessed from the
library when a creator needs to inspect what answers will be presented to a
respondent for a given question.

## Acceptance criteria
- Route `src/routes/app.sets.$setId.tsx` ported. Reads from
  `@/lib/platform/mock-store` and `@/lib/admin/answer-sets-mock-store`.
- Renders `Correct` and `Incorrect` columns; read-only (creators cannot edit
  platform answer sets — admin owns those).
- 404 state when `$setId` is unknown — renders a dedicated empty element with
  `data-testid="set-detail-not-found"`.
- Every meaningful element has a `data-testid`: `set-detail-title`,
  `set-detail-correct-column`, `set-detail-incorrect-column`,
  `set-detail-correct-row-${idx}`, `set-detail-incorrect-row-${idx}`,
  `set-detail-back-button`.
- Slovak strings extracted to `src/i18n/locales/sk/questions.json`.
- `npx eslint --fix` applied; lint 0/0.
- `tasks/FEATURE_MAP-admin-hub.md` row for `app.sets.$setId.tsx` marked Done with
  `see git log`.
- `CHANGELOG.md` entry — user-visible: yes.
- No Supabase imports.

## Implementation
Specific files (absolute paths from repo root):
- `cp /Users/lubomir/Desktop/subenai/admin-hub/src/routes/app.sets.$setId.tsx /Users/lubomir/Desktop/subenai/src/routes/app.sets.$setId.tsx`
- Path rewrites: `@/lib/platform/store` → `@/lib/platform/mock-store`;
  `@/lib/admin/answer-sets-store` → `@/lib/admin/answer-sets-mock-store`;
  `@/lib/user-mock-data` → `@/lib/platform/mock-user-data`.
- `npx eslint --fix /Users/lubomir/Desktop/subenai/src/routes/app.sets.$setId.tsx`.

## Tests
- Vitest at `tests/routes/app/sets-detail.test.tsx` — happy render of a seeded set
  (both columns visible) + edge: unknown `$setId` renders the not-found state.
- No Playwright spec at this stage.

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` — row marked Done with `see git log`.
- `CHANGELOG.md` — user-visible entry.
- privacy / cookies — N/A.

## Code review
Fresh-context prompt:
> Review the diff for AH-4.3. Confirm: (1) all data imports use `mock-` prefixed
> paths; (2) every element has a `data-testid` per the naming convention; (3) the
> 404 state has its own test id; (4) Slovak strings extracted to
> `src/i18n/locales/sk/questions.json`; (5) no Supabase calls. Review only — no edits.

**Effort**: S
**Depends on**: AH-1, AH-3, AH-4.4 (answer-sets-mock-store must exist)
**Source in admin-hub**: `routes/app.sets.$setId.tsx`

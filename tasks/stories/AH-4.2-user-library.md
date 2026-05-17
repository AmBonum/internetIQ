# AH-4.2 — User library (`/app/library`)

## Goal
Port the creator-facing question library at `/app/library` — read-only browser of
questions sourced from the user mock store so creators can pick from a curated bank
when assembling tests.

## Acceptance criteria
- Route `src/routes/app.library.tsx` ported. Reads from `@/lib/platform/mock-store`
  and seed in `@/lib/platform/mock-user-data` only.
- Search input, branch filter, difficulty filter all functional against the mock
  store.
- Every interactive element has a `data-testid`: `library-search-input`,
  `library-branch-filter`, `library-difficulty-filter`, `library-row-${id}`,
  `library-row-preview-${id}`, `library-empty-state`.
- Empty state rendered as a dedicated element with `data-testid="library-empty-state"`
  when filters yield zero rows.
- Slovak strings extracted to `src/i18n/locales/sk/questions.json` (same namespace
  as AH-4.1; no new file). Register confirmed in `src/i18n/resources.ts`.
- `npx eslint --fix` applied; lint 0/0.
- `tasks/FEATURE_MAP-admin-hub.md` row for `app.library.tsx` marked Done with
  `see git log`.
- `CHANGELOG.md` entry — user-visible: yes.
- No Supabase imports.

## Implementation
Specific files (absolute paths from repo root):
- `cp /Users/lubomir/Desktop/subenai/admin-hub/src/routes/app.library.tsx /Users/lubomir/Desktop/subenai/src/routes/app.library.tsx`
- Path rewrites: `@/lib/platform/store` → `@/lib/platform/mock-store`;
  `@/lib/user-mock-data` → `@/lib/platform/mock-user-data`.
- `npx eslint --fix /Users/lubomir/Desktop/subenai/src/routes/app.library.tsx`.

## Tests
- Vitest at `tests/routes/app/library.test.tsx` — happy render (seeded list visible)
  + edge: filter combination that produces zero rows shows the empty state.
- Vitest at `tests/routes/app/library-search.test.tsx` — typing into the search
  input narrows the visible rows.
- No Playwright spec at this stage.

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` — row marked Done with `see git log`.
- `CHANGELOG.md` — user-visible entry.
- privacy / cookies — N/A.

## Code review
Fresh-context prompt:
> Review the diff for AH-4.2. Confirm: (1) all data imports point at the `mock-`
> prefixed paths (no `@/lib/platform/store` or `@/lib/user-mock-data` without the
> mock prefix); (2) every interactive element + the empty state has a `data-testid`;
> (3) Slovak strings extracted to `src/i18n/locales/sk/questions.json`; (4) no
> Supabase calls. Review only — no edits.

**Effort**: S
**Depends on**: AH-1, AH-3, AH-4.1
**Source in admin-hub**: `routes/app.library.tsx`

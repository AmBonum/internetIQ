# AH-2.1 — Design token merge + shadcn primitives gap audit

## Goal
Merge admin-hub's Tailwind v4 design tokens into subenai's `src/styles.css` so the
ported `/app/*` and `/admin/*` routes render with the same look as the prototype.
Audit shadcn primitives between admin-hub and subenai and install any missing
ones. A directory diff (`ls admin-hub/src/components/ui/` vs `ls
src/components/ui/`) confirms the two sets are currently identical (46 files
each); therefore no new primitive installation is expected — this story exists to
explicitly verify and document that fact.

## Acceptance criteria
- `src/styles.css` audited line-by-line against `admin-hub/src/styles.css`. Every
  admin-hub `--*` token not already present in `src/styles.css` is added, namespaced
  with `--ah-` prefix if it collides with an existing subenai token (per PLAN
  Risks). Prefix is stripped in AH-11 when the unified theme is finalized.
- No subenai token is renamed or removed.
- `npm run build` produces an SSR worker bundle ✓; visual smoke of `/` and
  `/test` in the preview deploy is unchanged (existing tokens win on
  conflict-by-name pre-merge).
- shadcn primitives directory diff captured in the PR description:
  `diff <(ls admin-hub/src/components/ui/) <(ls src/components/ui/)` → empty.
  If non-empty (drift between when this plan was written and when the story
  executes), each missing primitive is added via `npx shadcn@latest add <name>`
  and committed.
- `package.json` deps: no expected change. If `npx shadcn` pulls in any new dep,
  it is committed in the same change.
- `npm run lint` 0/0; `tsc --noEmit` clean; `npm test` green.

## Implementation
Specific files (absolute paths from repo root):
- `/Users/lubomir/Desktop/subenai/src/styles.css` (token merge — additive only)
- `/Users/lubomir/Desktop/subenai/src/components/ui/<new-primitive>.tsx` (only if
  diff shows a gap; not expected based on current inventory)
- `/Users/lubomir/Desktop/subenai/package.json` (only if `npx shadcn` adds a new dep)
- `/Users/lubomir/Desktop/subenai/tsconfig.json` — no change expected.

## Tests
- Vitest snapshot at `tests/components/ui/token-smoke.test.tsx`: render a `Button`,
  a `Card`, and a `Badge` with each variant; snapshot the resolved class output.
  Snapshot must not change after this story (additive tokens only).
- For any newly added primitive (not expected): `tests/components/ui/<primitive>.test.tsx`
  with a basic render + a11y check.
- data-testids: N/A (token-only change).

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` Table 2 row `lib/utils.ts → merged into
  existing src/lib/utils.ts` is intentionally part of AH-2.1 but `lib/utils.ts` is
  read-only in this story — the actual utility merge happens in AH-3.1 when the
  first consumer arrives. Mark this row's status to In Progress here, Done in
  AH-3.1.
- `CHANGELOG.md` — N/A unless a visible color shifts (default light/dark contrast
  must not change).
- privacy / cookies docs — N/A.

## Code review
Fresh-context prompt:

> Review the token merge in `/Users/lubomir/Desktop/subenai/src/styles.css` against
> the source `/Users/lubomir/Desktop/subenai/admin-hub/src/styles.css`. Confirm:
> (1) every new admin-hub token is either present in subenai with the same value,
> or added with an `--ah-` prefix when its name collided; (2) no existing subenai
> token was renamed or removed; (3) light-mode and dark-mode contrast for the
> default Button, Card, and Badge has not regressed (run `npm run build` and open
> the preview); (4) the shadcn primitives directory diff is empty (run `diff <(ls
> /Users/lubomir/Desktop/subenai/admin-hub/src/components/ui/) <(ls
> /Users/lubomir/Desktop/subenai/src/components/ui/)`); (5) `npm run lint` 0/0,
> `npm test` green, `npm run build` ✓. Review only — do not modify code.

**Effort**: M
**Depends on**: —
**Source in admin-hub**: `src/styles.css`, `src/components/ui/` (diffed against subenai equivalents)

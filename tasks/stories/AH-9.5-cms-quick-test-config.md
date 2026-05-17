# AH-9.5 — Quick-test admin config + extend existing `/test` route to read from DB

**Epic:** AH-9 — CMS + site header / footer / sitemap
**Effort:** L (≤ 1 week)
**Priority:** P0 (data migration + production behavior change)
**Status:** Backlog

## Goal

Per Q6 Extend decision (PLAN.md Decisions section): `/admin/quick-test`
becomes the ADMIN CONFIG for the existing subenai public `/test` route.
The page stays at `/test`. Its content (title, description, branža, time
limit, pass %, difficulty, question list, visibility toggle) is now driven
by `quick_test_config` joined with `questions` via a new link table. The
15 hardcoded IQ questions in `src/lib/quiz/questions.ts` are MIGRATED into
the `questions` table and the hardcoded array is deleted. Existing
`attempts` data is preserved.

## Acceptance criteria

- All ported / refactored files have `npx eslint --fix` applied; `npm run lint` 0/0.
- New link table `quick_test_questions` (`quick_test_config_id`, `question_id`,
  `order_index`, unique on both pairs) appended to
  `supabase/migrations/20260517000000_admin_hub_schema.sql` and mirrored in
  `DEPLOY_SETUP.sql`; RLS enabled; read open, write admin-only.
- One-shot migration script at `scripts/migrate-iq-questions-to-db.ts` is
  idempotent: seeds `questions` with 15 rows from `src/lib/quiz/questions.ts`,
  inserts one `quick_test_config` row with current defaults (title "Rýchly
  test bezpečnosti", description, 2 min, 60% pass, "Ľahká", visible true,
  branža "Všeobecný test"), and creates 15 ordered `quick_test_questions`
  link rows. Running it twice does not duplicate.
- `src/lib/quiz/questions.ts` is deleted; `grep -r "lib/quiz/questions" src/`
  returns zero matches.
- `/test` route reads from `useQuickTestConfig()` (mock-flagged in this epic;
  AH-11.5 wires real Supabase). Scoring behavior is bit-for-bit unchanged
  against a recorded regression dataset.
- Toggle "Zobrazovať na webe" off → `/test` returns 404 (decision: 404 over
  redirect, to be confirmed in PR by reviewer).
- `data-testid` on every interactive element:
  `quick-test-config-form`, `quick-test-visibility-toggle`,
  `quick-test-title-input`, `quick-test-description-input`,
  `quick-test-branza-select`, `quick-test-time-input`,
  `quick-test-pass-input`, `quick-test-difficulty-select`,
  `quick-test-question-list-item-${id}`, `quick-test-save-button`,
  `test-route-disabled-fallback` (rendered on `/test` when toggle off).
- Slovak strings extended in `src/i18n/locales/sk/cms.json` (`quickTest.*` keys)
  and registered in `src/i18n/resources.ts`.
- Existing `attempts` rows remain queryable; spot-check 3 recent rows return
  original `score`, `answers_jsonb`, `created_at`.
- `tasks/FEATURE_MAP-admin-hub.md` rows for `admin/quick-test`,
  `quick_test_config`, `quick_test_questions` marked Done with commit SHA.
- `tasks/DATA-REUSE-MAP-admin-hub.md` IQ-question migration row marked
  complete with the script path.
- All existing `/test` e2e specs (locate via
  `grep -l "test\.index\|test\.zostav" e2e/specs/`) pass without changes.

## Implementation

- Append link table SQL to
  `supabase/migrations/20260517000000_admin_hub_schema.sql` (same file owned
  by AH-1.6 — additive). Mirror in `DEPLOY_SETUP.sql`.
- Regenerate `src/integrations/supabase/types.ts` after running migration
  locally.
- Write `scripts/migrate-iq-questions-to-db.ts` (idempotent INSERT with
  ON CONFLICT DO NOTHING on a natural key). Document run command in
  `DEPLOY_SETUP.sql` next to the cron stub comments.
- `cp admin-hub/src/routes/admin/quick-test.tsx src/routes/admin/quick-test.tsx`;
  rewrite mock-store imports per AH-3.1 conventions
  (`@/lib/admin/cms-store` → `@/lib/admin/cms-mock-store`).
- `npx eslint --fix src/routes/admin/quick-test.tsx`.
- Create `src/lib/quiz/use-quick-test-config.ts` — hook reads from
  `quick_test_config` + joined questions via the mock store in this epic.
- Refactor `src/routes/test*.tsx` (locate exact files via
  `find src/routes -name 'test*.tsx'`) to call `useQuickTestConfig()` instead
  of importing `src/lib/quiz/questions.ts`.
- Delete `src/lib/quiz/questions.ts` after all importers are updated.
- Extend `src/i18n/locales/sk/cms.json` with `quickTest.*` keys.

## Tests

- Vitest at `tests/routes/admin/quick-test.test.tsx` — form renders with seed
  values; edits persist via mock store; visibility toggle off renders
  `test-route-disabled-fallback` on the next `/test` render.
- Vitest at `tests/routes/test.test.tsx` — refactored route reads from
  `quick_test_config` mock; scoring output identical to recorded regression
  dataset; grep guard asserts no surviving import of `lib/quiz/questions`.
- Playwright at `e2e/specs/admin/quick-test.spec.ts` — admin edit flow with
  `test.step()` wrapping each step (per CLAUDE.md / CI rule); POM at
  `e2e/poms/admin/QuickTestPage.ts`.
- Playwright at `e2e/specs/test/visibility-toggle.spec.ts` — toggle off via
  mock-admin path, hit `/test`, assert 404.
- Existing `/test` e2e specs (E1.x..E3.x) MUST pass without modification of
  expected scores or question text.
- POM-only locators per CLAUDE.md.

## Documentation

- `tasks/FEATURE_MAP-admin-hub.md` — rows Done.
- `tasks/DATA-REUSE-MAP-admin-hub.md` — IQ-question migration row complete.
- `CHANGELOG.md` — entry (Slovak, user-visible): "Rýchly test sa teraz
  konfiguruje cez admin rozhranie; obsah a viditeľnosť riadi admin."
- `DEPLOY_SETUP.sql` — migration script run command in the comment block.

## Code review

Fresh-context prompt: confirm migration script is idempotent;
`src/lib/quiz/questions.ts` is gone with no surviving import; `/test`
produces identical scores against the regression dataset; visibility toggle
off truly disables the route (no SSR leak); RLS on the new link table —
read open, write admin-only; existing `attempts` rows still queryable.

**Effort:** L
**Depends on:** AH-1.3 (`questions` table), AH-1.6 (`quick_test_config`),
AH-9 shell context
**Source in admin-hub:** `admin-hub/src/routes/admin/quick-test.tsx`,
`admin-hub/docs/ADMIN_GUIDE.md` (quick-test section)
**New files:** `scripts/migrate-iq-questions-to-db.ts`,
`src/lib/quiz/use-quick-test-config.ts`
**Deleted files:** `src/lib/quiz/questions.ts`
**Refactored:** `src/routes/test*.tsx` (specific paths via `find` at impl time)

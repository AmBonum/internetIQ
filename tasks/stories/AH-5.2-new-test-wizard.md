# AH-5.2 — New-test wizard (`/app/tests/new`) — multi-step

## Goal
Port the four-step new-test wizard (basics → audience → questions → share) with
forward/back navigation, per-step validation, and final commit into the user mock
store with a generated `share_id` so the share step can render a working link.

## Acceptance criteria
- Route `src/routes/app.tests.new.tsx` ported with the wizard split into four
  steps. Steps are addressable via URL search param `?step=1..4` so the back button
  works.
- Per-step validation blocks "Next" until required fields are filled. Final "Publish"
  on step 4 calls `@/lib/platform/mock-store` to insert the test with a generated
  `share_id` and redirects to `/app/tests/$testId`.
- Every interactive element has a `data-testid`:
  `new-test-wizard-step-${n}-root` (n = 1..4),
  `new-test-wizard-step-${n}-next`, `new-test-wizard-step-${n}-back`,
  `new-test-wizard-progress`, `new-test-wizard-publish-button`,
  `new-test-wizard-title-input`, `new-test-wizard-description-input`,
  `new-test-wizard-audience-select`, `new-test-wizard-question-row-${idx}`,
  `new-test-wizard-question-add-button`, `new-test-wizard-share-link-input`,
  `new-test-wizard-share-copy-button`.
- Slovak strings extracted to `src/i18n/locales/sk/tests.json`.
- `npx eslint --fix` on the route; lint 0/0.
- `tasks/FEATURE_MAP-admin-hub.md` row for `app.tests.new.tsx` marked Done with
  `see git log`.
- `CHANGELOG.md` entry — user-visible: yes.
- No Supabase imports.

## Implementation
Specific files (absolute paths from repo root):
- `cp /Users/lubomir/Desktop/subenai/admin-hub/src/routes/app.tests.new.tsx /Users/lubomir/Desktop/subenai/src/routes/app.tests.new.tsx`
- Path rewrites: `@/lib/platform/store` → `@/lib/platform/mock-store`;
  `@/lib/user-mock-data` → `@/lib/platform/mock-user-data`.
- `npx eslint --fix /Users/lubomir/Desktop/subenai/src/routes/app.tests.new.tsx`.

## Tests
- Vitest at `tests/routes/app/new-test-wizard.test.tsx` — render step 1, fill
  required fields, step through 1→2→3→4, assert progress indicator updates and
  publish action calls the mock store with a generated share_id.
- Edge: leaving step 1 title empty keeps the Next button disabled (validation).
- Playwright spec at `e2e/specs/app/new-test-wizard.spec.ts` with `test.step()`
  wrapping each of the four steps and a final "publish + redirect" step. POM at
  `e2e/poms/app/NewTestWizardPage.ts`. POM-only locators.

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` — row marked Done with `see git log`.
- `CHANGELOG.md` — user-visible entry.
- privacy / cookies — N/A.

## Code review
Fresh-context prompt:
> Review the diff for AH-5.2. Confirm: (1) imports use `mock-` prefixed paths;
> (2) every wizard step root and every Next / Back / Publish button has a
> `data-testid` matching `new-test-wizard-step-${n}-*`; (3) URL `?step=` survives
> reload; (4) validation blocks Next; (5) the Playwright spec uses POM-only
> locators and `test.step()` per wizard step; (6) Slovak strings extracted to
> `src/i18n/locales/sk/tests.json`; (7) no Supabase calls. Review only — no edits.

**Effort**: L
**Depends on**: AH-1, AH-3, AH-5.1
**Source in admin-hub**: `routes/app.tests.new.tsx`

# AH-5.3 — User test editor (`/app/tests/$testId`) + ShareDialog

## Goal
Port the creator-facing single-test view: results / analytics tabs, edit basics,
manage questions, and the `ShareDialog` that exposes the public `/t/<shareId>` URL
with a copy-to-clipboard action.

## Acceptance criteria
- Route `src/routes/app.tests.$testId.tsx` ported.
- Component `src/components/user/ShareDialog.tsx` ported. Renders the share URL as
  `${origin}/t/${shareId}` and offers copy-to-clipboard.
- Tabs: Results / Analytics / Settings; each tab addressable via URL search param.
- Every interactive element has a `data-testid`: `test-editor-tabs-results`,
  `test-editor-tabs-analytics`, `test-editor-tabs-settings`,
  `test-editor-share-button`, `test-editor-title-input`,
  `test-editor-save-button`, `test-editor-archive-button`,
  `test-editor-publish-button`, `share-dialog-root`,
  `share-dialog-url-input`, `share-dialog-copy-link-button`,
  `share-dialog-close-button`.
- 404 state when `$testId` is unknown — `data-testid="test-editor-not-found"`.
- Slovak strings extracted to `src/i18n/locales/sk/tests.json`.
- `npx eslint --fix` on every ported file; lint 0/0.
- `tasks/FEATURE_MAP-admin-hub.md` rows for `app.tests.$testId.tsx` and
  `ShareDialog.tsx` marked Done with `see git log`.
- `CHANGELOG.md` entry — user-visible: yes.
- No Supabase imports.

## Implementation
Specific files (absolute paths from repo root):
- `cp /Users/lubomir/Desktop/subenai/admin-hub/src/routes/app.tests.$testId.tsx /Users/lubomir/Desktop/subenai/src/routes/app.tests.$testId.tsx`
- `cp /Users/lubomir/Desktop/subenai/admin-hub/src/components/user/ShareDialog.tsx /Users/lubomir/Desktop/subenai/src/components/user/ShareDialog.tsx`
- Path rewrites: `@/lib/platform/store` → `@/lib/platform/mock-store`;
  `@/lib/user-mock-data` → `@/lib/platform/mock-user-data`.
- `npx eslint --fix` on the two new files.

## Tests
- Vitest at `tests/routes/app/test-editor.test.tsx` — happy render of a seeded test,
  switch tabs via search-param URL, save edits round-trip through the mock store;
  edge: unknown `$testId` renders not-found.
- Vitest at `tests/components/user/share-dialog.test.tsx` — clipboard mock
  (`navigator.clipboard.writeText`) verifies copied URL matches
  `/^https?:\/\/[^/]+\/t\/[a-z0-9-]+$/`.
- Playwright spec at `e2e/specs/app/test-editor.spec.ts` wrapping each tab in
  `test.step()` plus a "share dialog copy" step. POM at
  `e2e/poms/app/TestEditorPage.ts` with a nested `ShareDialog` POM. POM-only
  locators.

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` — rows marked Done with `see git log`.
- `CHANGELOG.md` — user-visible entry.
- privacy / cookies — N/A (share link surface itself is governed by AH-8 / AH-7).

## Code review
Fresh-context prompt:
> Review the diff for AH-5.3. Confirm: (1) imports use `mock-` prefixed paths;
> (2) every tab, button, and dialog element has a `data-testid`; (3) ShareDialog
> emits a URL matching `/t/<shareId>` shape (clipboard test asserts this);
> (4) Playwright spec uses POM-only locators with `test.step()`; (5) Slovak
> strings in `src/i18n/locales/sk/tests.json`; (6) no Supabase calls.
> Review only — no edits.

**Effort**: M
**Depends on**: AH-1, AH-3, AH-5.1
**Source in admin-hub**: `routes/app.tests.$testId.tsx`,
`components/user/ShareDialog.tsx`

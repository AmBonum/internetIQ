# AH-5.5 — User templates (`/app/templates`)

## Goal
Port the test-templates browser where creators pick a preset starting point that
prefills the new-test wizard. Read-only list; clone-to-wizard is the only action.

## Acceptance criteria
- Route `src/routes/app.templates.tsx` ported. Reads from
  `@/lib/platform/mock-store`.
- "Použiť šablónu" action on a row navigates to `/app/tests/new?templateId=<id>`;
  the wizard (AH-5.2) is expected to honour this param.
- Every interactive element has a `data-testid`: `templates-list-row-${id}`,
  `templates-row-preview-${id}`, `templates-row-use-${id}`,
  `templates-list-search-input`, `templates-list-category-filter`,
  `templates-list-empty-state`.
- Slovak strings extracted to `src/i18n/locales/sk/tests.json`.
- `npx eslint --fix` applied; lint 0/0.
- `tasks/FEATURE_MAP-admin-hub.md` row for `app.templates.tsx` marked Done with
  `see git log`.
- `CHANGELOG.md` entry — user-visible: yes.
- No Supabase imports.

## Implementation
Specific files (absolute paths from repo root):
- `cp /Users/lubomir/Desktop/subenai/admin-hub/src/routes/app.templates.tsx /Users/lubomir/Desktop/subenai/src/routes/app.templates.tsx`
- Path rewrites: `@/lib/platform/store` → `@/lib/platform/mock-store`;
  `@/lib/user-mock-data` → `@/lib/platform/mock-user-data`.
- `npx eslint --fix /Users/lubomir/Desktop/subenai/src/routes/app.templates.tsx`.

## Tests
- Vitest at `tests/routes/app/templates.test.tsx` — happy render, search narrows
  list, "Použiť šablónu" click triggers a router navigation with the templateId
  search param; edge: empty state.
- No Playwright spec at this stage.

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` — row marked Done with `see git log`.
- `CHANGELOG.md` — user-visible entry.
- privacy / cookies — N/A.

## Code review
Fresh-context prompt:
> Review the diff for AH-5.5. Confirm: (1) imports use `mock-` prefixed paths;
> (2) every interactive element has a `data-testid`; (3) "Použiť šablónu"
> navigates with the templateId search param; (4) Slovak strings in
> `src/i18n/locales/sk/tests.json`; (5) no Supabase calls. Review only — no edits.

**Effort**: XS
**Depends on**: AH-1, AH-3, AH-5.2
**Source in admin-hub**: `routes/app.templates.tsx`

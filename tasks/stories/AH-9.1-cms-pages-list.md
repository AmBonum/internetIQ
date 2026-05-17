# AH-9.1 — Admin CMS pages list (`/admin/pages`) + mock store + hooks

**Epic:** AH-9 — CMS + site header / footer / sitemap
**Effort:** M
**Status:** Backlog

## Goal
Port the admin-hub CMS pages index route and supporting mock store + hooks layer
into subenai. This is the entry point for content editors to list, filter, and
publish/unpublish CMS pages. Mock-only in this epic; AH-11 swaps to Supabase.

## Acceptance criteria
- Route `/admin/pages` lists all CMS pages (title, slug, `published_at`, updated).
- Filter by status (draft / published) and free-text search on title or slug.
- New-page button creates a draft row in the mock store and navigates to AH-9.2.
- All ported files have `npx eslint --fix` applied; lint 0/0.
- data-testids: `cms-pages-list-row-${id}`, `cms-pages-list-new-button`,
  `cms-pages-list-status-filter`, `cms-pages-list-search-input`.
- Slovak strings in `src/i18n/locales/sk/cms.json` and registered in
  `src/i18n/resources.ts` + `src/i18n/types.d.ts`.
- FEATURE_MAP-admin-hub.md row `AH-9.1` marked `Done` with commit SHA.
- CHANGELOG entry (user-visible: yes — admins gain CMS list view).
- Mock-only in this epic; AH-11 wires real Supabase.

## Implementation
- `cp admin-hub/src/routes/admin/pages.tsx src/routes/admin/pages.tsx`
- `cp admin-hub/src/lib/admin/cms-store.ts src/lib/admin/cms-mock-store.ts`
- `cp admin-hub/src/lib/admin/cms-hooks.ts src/lib/admin/cms-hooks.ts`
- Path rewrites in the copied files:
  - `@/lib/admin/cms-store` → `@/lib/admin/cms-mock-store`
  - `@/lib/admin/cms-hooks` stays as-is (hooks remain after AH-11; only the
    store backing them is swapped).
- New file: `src/i18n/locales/sk/cms.json` with keys `pagesList.*`.
- Register namespace in `src/i18n/resources.ts` and `src/i18n/types.d.ts`.
- `npx eslint --fix src/routes/admin/pages.tsx src/lib/admin/cms-mock-store.ts src/lib/admin/cms-hooks.ts`
- Add the test-ids listed above to the copied source.

## Tests
- Vitest: `tests/routes/admin/pages.test.tsx`
  - Renders list with seeded rows.
  - Status filter narrows the list.
  - Search input narrows by title and by slug.
  - "New page" button calls the create-page mock hook and navigates.

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` — mark row Done (`see git log`).
- `CHANGELOG.md` — user-visible entry.
- `src/content/legal/*.md` — N/A (no PII; AH-7.1 owns privacy).

## Code review
Fresh-context prompt: confirm no Supabase imports; data-testids present;
i18n namespace registered; mock store and hooks live in expected paths; no
client-side admin role check (that lives in AH-10 shell).

**Effort:** M
**Depends on:** AH-1 (CMS table types), AH-3 (app shell), AH-10 (admin shell)
**Source in admin-hub:** `src/routes/admin/pages.tsx`, `src/lib/admin/cms-store.ts`,
`src/lib/admin/cms-hooks.ts`

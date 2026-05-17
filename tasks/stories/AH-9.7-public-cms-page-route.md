# AH-9.7 — Public CMS page route (`/s/$slug`) with publish gate

**Epic:** AH-9 — CMS + site header / footer / sitemap
**Effort:** M
**Status:** Backlog

## Goal
Port the public CMS page renderer at `/s/$slug`. Loads a page by slug,
returns 404 when `published_at IS NULL`, renders the block list using the
same block components ported in AH-9.2. SSR-safe; loaded via
`createServerFn` with safe-column projection. Mock-flagged in this epic.

## Acceptance criteria
- Route `/s/$slug` renders a published page by slug.
- Returns a 404 page (existing subenai NotFoundPage) when `published_at IS NULL`
  or the slug is unknown.
- Loader is a `createServerFn` server function with safe-column projection
  (`id, slug, title, seo_description, content_blocks, published_at`). No
  `owner_id` or audit columns leaked to the client.
- SSR-safe: no `window` access on initial render; data is hydrated, not refetched.
- All ported files have `npx eslint --fix` applied; lint 0/0.
- data-testids: `public-cms-page-content`, `public-cms-page-title`,
  `public-cms-page-block-${idx}`.
- No new i18n strings (renders authored content verbatim). Existing site header
  + footer render around the content (after AH-9.8).
- FEATURE_MAP-admin-hub.md row `AH-9.7` marked `Done` with commit SHA.
- CHANGELOG entry (user-visible: yes — new public route).
- Mock-flagged: `src/lib/cms/get-page.functions.ts` skeleton reads from the
  mock store; TODO marker references AH-11 for the Supabase swap.

## Implementation
- `cp admin-hub/src/routes/s.$slug.tsx src/routes/s.$slug.tsx`
- New: `src/lib/cms/get-page.functions.ts` — `createServerFn` wrapper with
  inline mock-store read; explicit safe-column projection list; `TODO(AH-11):
  swap to supabaseAdmin with same projection`.
- Path rewrites: `@/lib/admin/cms-store` → `@/lib/admin/cms-mock-store`.
- `npx eslint --fix src/routes/s.$slug.tsx src/lib/cms/get-page.functions.ts`
- Add test-ids listed above.

## Tests
- Vitest: `tests/routes/s.slug.test.tsx`
  - Renders all blocks for a seeded published page.
  - Returns NotFound for unknown slug.
  - Returns NotFound for a draft page (`published_at IS NULL`).
  - Safe-column projection does not include `owner_id` in the loader result.
- Playwright: `e2e/specs/cms/public-page.spec.ts`
  - Runs without auth.
  - Asserts 404 for an unpublished slug.
  - Asserts 200 + content visible for a published seeded slug.
  - POM at `e2e/poms/cms/PublicPage.ts` (testid getters only).

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` — mark row Done (`see git log`).
- `CHANGELOG.md` — user-visible entry.
- `src/content/legal/*.md` — N/A (no PII; admin-authored content only).

## Code review
Fresh-context: no Supabase imports in this epic; server fn returns only listed
columns; draft pages 404; SSR boundary respected; i18n unchanged;
`get-page.functions.ts` carries the AH-11 TODO; mock-store only.

**Effort:** M
**Depends on:** AH-1 (DB types), AH-3, AH-9.1 (page list shape)
**Source in admin-hub:** `src/routes/s.$slug.tsx`

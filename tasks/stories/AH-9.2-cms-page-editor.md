# AH-9.2 — Admin CMS page editor (`/admin/pages/$pageId`) with block content

**Epic:** AH-9 — CMS + site header / footer / sitemap
**Effort:** L
**Status:** Backlog

## Goal
Port the admin-hub CMS page editor — slug, title, SEO meta, and an ordered list
of content blocks (heading / paragraph / image / cta). Editors can add, reorder,
edit, and remove blocks, then save draft or publish. Mock-only in this epic.

## Acceptance criteria
- Route `/admin/pages/$pageId` loads a CMS page by id from the mock store; 404
  state when missing.
- Slug, title, SEO description, and `published_at` (toggle "Publikovať")
  are editable; client-side validation on slug (`^[a-z0-9-]+$`) and required title.
- Block editor supports: add block (type picker), reorder (up/down or drag),
  delete, inline edit. Block types ported: `heading`, `paragraph`, `image`, `cta`.
- "Uložiť" persists to the mock store; "Publikovať" sets `published_at = now()`;
  "Späť do konceptu" clears `published_at`.
- All ported files have `npx eslint --fix` applied; lint 0/0.
- data-testids: `cms-page-editor-block-${idx}`, `cms-page-editor-add-block`,
  `cms-page-editor-save`, `cms-page-editor-publish`,
  `cms-page-editor-slug-input`, `cms-page-editor-title-input`.
- Slovak strings extended in `src/i18n/locales/sk/cms.json` (keys `pageEditor.*`).
- FEATURE_MAP-admin-hub.md row `AH-9.2` marked `Done` with commit SHA.
- CHANGELOG entry (user-visible: yes).
- Mock-only in this epic; AH-11 wires real Supabase.

## Implementation
- `cp admin-hub/src/routes/admin/pages.$pageId.tsx src/routes/admin/pages.$pageId.tsx`
- Port supporting block components from `admin-hub/src/components/admin/cms/*`
  into `src/components/admin/cms/` (one-to-one paths).
- Path rewrites: `@/lib/admin/cms-store` → `@/lib/admin/cms-mock-store`;
  `@/lib/admin/cms-hooks` stays.
- `npx eslint --fix` each copied file.
- Add test-ids listed above to the editor + each block row.
- Extend `src/i18n/locales/sk/cms.json` with editor keys.

## Tests
- Vitest: `tests/routes/admin/pages.editor.test.tsx`
  - Loads a seeded page and renders all blocks.
  - Add-block flow inserts a new block at the end.
  - Reorder moves a block up; delete removes it.
  - Save calls the mock-store update hook.
  - Publish sets `published_at`; revert clears it.
  - Slug validation rejects invalid characters.

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` — mark row Done (`see git log`).
- `CHANGELOG.md` — user-visible entry.
- `src/content/legal/*.md` — N/A.

## Code review
Fresh-context: confirm no Supabase imports; block reorder logic is pure (no DOM
hacks); test-ids on every block + editor control; slug regex matches DB CHECK;
i18n keys consistent with AH-9.1; mock-store imports only.

**Effort:** L
**Depends on:** AH-1 (DB types), AH-3 (app shell), AH-9.1 (page list shape), AH-10
**Source in admin-hub:** `src/routes/admin/pages.$pageId.tsx`,
`src/components/admin/cms/*`

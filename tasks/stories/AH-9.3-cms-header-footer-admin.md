# AH-9.3 — Admin header + footer admin (`/admin/header`, `/admin/footer`)

**Epic:** AH-9 — CMS + site header / footer / sitemap
**Effort:** M
**Status:** Backlog

## Goal
Port the admin-hub config CRUD for the site header (`cms_header`) and site
footer (`cms_footer`) — branding, columns, social links. The output of this
config feeds AH-9.8's `SiteHeader.tsx` and `Footer.tsx` (in AH-11; mock-only here).

## Acceptance criteria
- Route `/admin/header` exposes a single-row editor for `cms_header` (logo URL,
  CTA label/link, mobile-trigger label).
- Route `/admin/footer` exposes a column-based editor: add/remove column, add/
  remove link per column, social-link row.
- Save persists to mock store; lint 0/0.
- All ported files have `npx eslint --fix` applied.
- data-testids: `cms-header-form`, `cms-header-form-save`,
  `cms-footer-form`, `cms-footer-form-save`,
  `cms-footer-column-${idx}`, `cms-footer-column-link-${columnIdx}-${linkIdx}`.
- Slovak strings extended in `src/i18n/locales/sk/cms.json` (keys
  `headerAdmin.*`, `footerAdmin.*`).
- FEATURE_MAP-admin-hub.md rows `AH-9.3` (header and footer entries) marked
  `Done` with commit SHA.
- CHANGELOG entry (user-visible: yes).
- Mock-only in this epic; AH-11 wires real Supabase.

## Implementation
- `cp admin-hub/src/routes/admin/header.tsx src/routes/admin/header.tsx`
- `cp admin-hub/src/routes/admin/footer.tsx src/routes/admin/footer.tsx`
- Path rewrites: `@/lib/admin/cms-store` → `@/lib/admin/cms-mock-store`;
  `@/lib/admin/cms-hooks` stays.
- `npx eslint --fix src/routes/admin/header.tsx src/routes/admin/footer.tsx`
- Extend `src/i18n/locales/sk/cms.json`.
- Add test-ids to copied files.

## Tests
- Vitest: `tests/routes/admin/header.test.tsx` — renders fields, save calls
  update hook.
- Vitest: `tests/routes/admin/footer.test.tsx` — add column, add link, remove,
  reorder; save calls update hook; empty footer state.

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` — mark rows Done (`see git log`).
- `CHANGELOG.md` — user-visible entry.
- `src/content/legal/*.md` — N/A.

## Code review
Fresh-context: no Supabase imports; test-ids on every field and row; i18n keys
under namespace `cms`; mock-store only; config shape matches `cms_header` and
`cms_footer` DB tables from AH-1.

**Effort:** M
**Depends on:** AH-1 (DB types), AH-3, AH-10
**Source in admin-hub:** `src/routes/admin/header.tsx`, `src/routes/admin/footer.tsx`

# AH-9.4 — Admin navigation (`/admin/navigation`) — nav structure CRUD

**Epic:** AH-9 — CMS + site header / footer / sitemap
**Effort:** M
**Status:** Backlog

## Goal
Port the admin-hub navigation editor — a tree (or flat list with `parent_id`) of
nav items, each with label, URL, position, and visibility flag. This drives the
site header nav in AH-11. Mock-only in this epic.

## Acceptance criteria
- Route `/admin/navigation` lists nav items in order; supports add, edit,
  reorder, delete, and toggle visibility.
- Nav item edit dialog: label, URL (relative or absolute), open-in-new-tab flag,
  visible-when-authenticated-only flag (drives the AH-9.8 "Moje testy" gate).
- All ported files have `npx eslint --fix` applied; lint 0/0.
- data-testids: `cms-nav-item-${id}`, `cms-nav-item-edit-${id}`,
  `cms-nav-item-delete-${id}`, `cms-nav-add-button`,
  `cms-nav-item-form-label`, `cms-nav-item-form-url`,
  `cms-nav-item-form-save`.
- Slovak strings extended in `src/i18n/locales/sk/cms.json` (keys `navAdmin.*`).
- FEATURE_MAP-admin-hub.md row `AH-9.4` marked `Done` with commit SHA.
- CHANGELOG entry (user-visible: yes).
- Mock-only in this epic; AH-11 wires real Supabase.

## Implementation
- `cp admin-hub/src/routes/admin/navigation.tsx src/routes/admin/navigation.tsx`
- Path rewrites: `@/lib/admin/cms-store` → `@/lib/admin/cms-mock-store`;
  `@/lib/admin/cms-hooks` stays.
- `npx eslint --fix src/routes/admin/navigation.tsx`
- Extend `src/i18n/locales/sk/cms.json` with `navAdmin.*` keys.
- Add test-ids listed above.

## Tests
- Vitest: `tests/routes/admin/navigation.test.tsx`
  - Renders seeded items in order.
  - Add inserts at end.
  - Reorder swaps positions.
  - Edit updates label and URL.
  - Toggle visibility flips flag.
  - Delete removes the row.
  - Empty state renders without items.

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` — mark row Done (`see git log`).
- `CHANGELOG.md` — user-visible entry.
- `src/content/legal/*.md` — N/A.

## Code review
Fresh-context: no Supabase imports; test-ids on every row and form field; URL
field validates relative-or-https only; auth-only flag plumbed through; i18n
under `cms` namespace; mock-store only.

**Effort:** M
**Depends on:** AH-1 (DB types), AH-3, AH-10
**Source in admin-hub:** `src/routes/admin/navigation.tsx`

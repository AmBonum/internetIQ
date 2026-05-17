# AH-9.8 — Site header + footer link integration (Moje testy, Platforma)

**Epic:** AH-9 — CMS + site header / footer / sitemap
**Effort:** M
**Status:** Backlog

## Goal
Extend subenai's existing `SiteHeader.tsx` and `Footer.tsx` with platform-aware
links: a "Moje testy" header nav link to `/app` (rendered only when the user is
authenticated) and a "Platforma" footer column with a `/app` link plus an
`/admin` link rendered only for admin role. Preserves existing test-ids and
existing tests stay green.

## Acceptance criteria
- `SiteHeader.tsx` renders "Moje testy" nav link to `/app` only when the user
  is authenticated (client-side check via the mock auth context from AH-3 in
  this epic; AH-11 wires real Supabase Auth).
- `Footer.tsx` renders a new "Platforma" column with:
  - `/app` link, visible to all authenticated users.
  - `/admin` link, visible only when the auth context reports admin role.
- Unauthenticated visitors see neither the header link nor the footer column
  (the column itself is hidden when empty).
- All existing site-header and footer test-ids preserved verbatim.
- New data-testids: `site-header-nav-link-app`, `footer-platform-column`,
  `footer-platform-link-app`, `footer-platform-link-admin`.
- i18n strings extended in the **existing** header/footer namespaces (do NOT
  create a new namespace). Keys: `nav.myTests` (Slovak: "Moje testy"),
  `footer.platformColumn.title` ("Platforma"), `footer.platformColumn.app`
  ("Tvorba testov"), `footer.platformColumn.admin` ("Administrácia").
- Existing site-header and footer Vitest + Playwright tests still green
  (run `npm test` and `npm run e2e:browser -- site-header footer`).
- `npx eslint --fix` applied to edited files; lint 0/0.
- FEATURE_MAP-admin-hub.md row `AH-9.8` marked `Done` with commit SHA.
- CHANGELOG entry (user-visible: yes — new header link + footer column).
- Mock-only in this epic; AH-11 wires the real auth source.

## Implementation
- EDIT `src/components/layout/SiteHeader.tsx` — add conditional nav item;
  preserve all existing test-ids.
- EDIT `src/components/layout/Footer.tsx` — add the "Platforma" column;
  preserve existing column test-ids; new column is the last in mobile order.
- EDIT existing header/footer i18n namespace files under `src/i18n/locales/sk/`
  to add the new keys (locate via `ls src/i18n/locales/sk/`); do NOT create a
  new namespace.
- Auth context: use the mock auth context wired in AH-3 (`useAuth()` returning
  `{ user, role }`); no Supabase call here.
- `npx eslint --fix src/components/layout/SiteHeader.tsx src/components/layout/Footer.tsx`

## Tests
- Vitest: extend the existing `SiteHeader` and `Footer` test files
  (do not duplicate) with new cases:
  - Unauthenticated → no "Moje testy" link; no "Platforma" column.
  - Authenticated non-admin → "Moje testy" visible; "Platforma" column with
    `/app` link only; no `/admin` link.
  - Authenticated admin → both links visible.
- Playwright: `e2e/specs/marketing/site-header-app-link.spec.ts`
  - Storage-state-driven auth states (anonymous, user, admin).
  - POM extends existing `e2e/poms/marketing/SiteHeader.ts` and
    `e2e/poms/marketing/Footer.ts` with the new getters.
  - POM-only locators per CLAUDE.md.

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` — mark row Done (`see git log`).
- `CHANGELOG.md` — user-visible entry.
- `src/content/legal/*.md` — N/A.

## Code review
Fresh-context: no Supabase imports in this epic; conditional rendering keyed
on the mock auth context; every existing test-id preserved; new test-ids added;
existing tests still green; i18n keys live in the existing namespace, not a
new file; admin link only renders on admin role.

**Effort:** M
**Depends on:** AH-3 (mock auth context), AH-10 (defines admin role helper)
**Source in admin-hub:** N/A — this story EDITS existing subenai files.
Reference for the link target shape: `admin-hub/src/components/user/AppShell.tsx`
nav structure.

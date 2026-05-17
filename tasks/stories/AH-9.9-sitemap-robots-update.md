# AH-9.9 — Sitemap + robots update for `/s/$slug` and `/app`, `/admin` exclusion

**Epic:** AH-9 — CMS + site header / footer / sitemap
**Effort:** M
**Status:** Backlog

## Goal
Update `public/sitemap.xml` to include one entry per published CMS page
(`/s/$slug`) and create or update `public/robots.txt` to `Disallow` the
authenticated `/app/` and `/admin/` route trees plus the dynamic `/t/$shareId`
respondent path. Verified by a Playwright integration spec.

## Acceptance criteria
- `public/sitemap.xml` includes one `<url>` entry per published CMS page from
  the mock store seed (at least one seeded published page exists). Each entry
  has `<loc>https://subenai.sk/s/{slug}</loc>`, `<changefreq>monthly`,
  `<priority>0.5`.
- All existing sitemap entries preserved (additive change only; no removals).
- All `/app/*`, `/admin/*`, and `/t/$shareId` paths are EXCLUDED from
  `public/sitemap.xml`.
- `public/robots.txt` (create if it does not exist; edit if it does) includes:
  - `User-agent: *`
  - `Disallow: /app/`
  - `Disallow: /admin/`
  - `Disallow: /t/`
  - `Sitemap: https://subenai.sk/sitemap.xml`
- Existing `robots.txt` directives (if any) preserved.
- No new i18n strings.
- `npx eslint --fix` not applicable (XML / plain text files); manual diff review.
- FEATURE_MAP-admin-hub.md row `AH-9.9` marked `Done` with commit SHA.
- CHANGELOG entry (user-visible: yes — SEO surface).
- Mock-only in this epic: the seeded slug used for the sitemap row comes from
  the mock CMS store. AH-11 will swap the generator to read published slugs
  from Supabase at build time.

## Implementation
- EDIT `public/sitemap.xml` — add `/s/{slug}` entries (one per seeded published
  page; preserve all existing entries).
- CREATE or EDIT `public/robots.txt` with the directives above.
- Spec used for the build-time generation (AH-11): document the intent in a
  short comment inside `src/lib/cms/get-page.functions.ts` (`TODO(AH-11):
  enumerate published slugs for sitemap generation`).

## Tests
- Playwright integration: `e2e/integration/seo/sitemap-robots.spec.ts`
  - HTTP GET `/sitemap.xml` → 200; body contains `/s/{seeded-slug}`.
  - Body does NOT contain `/app/`, `/admin/`, or `/t/`.
  - HTTP GET `/robots.txt` → 200; body contains all three `Disallow` lines
    and the `Sitemap:` line.
- POM-only locators per CLAUDE.md (integration spec uses HTTP fetch, no DOM POM
  needed; assertions live inline on the response body string).

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` — mark row Done (`see git log`).
- `CHANGELOG.md` — user-visible entry.
- `src/content/legal/*.md` — N/A.

## Code review
Fresh-context: sitemap is additive; no existing entries removed; `/app`,
`/admin`, and `/t` excluded; robots.txt directives match the PLAN; integration
spec covers both files; mock seed contains at least one published slug for the
test to assert on.

**Effort:** M
**Depends on:** AH-9.1 (mock CMS pages must be seeded)
**Source in admin-hub:** N/A — this story EDITS subenai's `public/` files.
Reference: `tasks/PLAN-2026-05-17-admin-hub-integration.md` "Site Header /
Footer / Sitemap Impact" section.

# AH-1.6 — CMS + config tables (cms_pages, cms_header, cms_footer, cms_navigation, share_card_config, quick_test_config, support_config, app_settings)

## Goal
Land the eight tables backing the CMS for marketing sub-pages and the singleton
config rows for header/footer/navigation/share-card/quick-test/support/app
settings. Backs AH-9 (CMS) and AH-10 (admin panel settings).

## Acceptance criteria
- Tables created per `admin-hub/docs/DATABASE.md` §1 (CMS + Globálne settings):
  - `cms_pages(id, slug UNIQUE, title, seo_title, seo_description, blocks jsonb,
    status, published_at, created_at, updated_at)`
  - `cms_header(id, logo, nav jsonb, updated_at)` — enforced singleton via
    `CHECK (id = 1)` or `UNIQUE` partial index on `(true)`.
  - `cms_footer(id, columns jsonb, socials jsonb, legal jsonb, updated_at)` —
    singleton.
  - `cms_navigation(id, items jsonb, updated_at)` — singleton.
  - `share_card_config(id, tiers jsonb, gradient, branding jsonb, updated_at)` —
    singleton.
  - `quick_test_config(id, config jsonb, updated_at)` — singleton.
  - `support_config(id, email, hours, enabled bool, updated_at)` — singleton.
  - `app_settings(key text PRIMARY KEY, value jsonb, updated_at, updated_by FK
    auth.users)`
- Indexes: `cms_pages(slug)`, `cms_pages(status, published_at DESC)`.
- Singleton enforcement: each singleton table has `CHECK (id = 1)` and a seed row
  inserted as part of the migration (`INSERT INTO cms_header (id, ...) VALUES (1,
  ...) ON CONFLICT DO NOTHING;`).
- RLS ENABLED on all 8 tables; policies in AH-1.7 (anon read on `cms_pages WHERE
  status = 'published'`; admin-only write on all).
- `DEPLOY_SETUP.sql` mirrored.
- `npm run lint` 0/0; `tsc --noEmit` clean.
- `tasks/FEATURE_MAP-admin-hub.md` rows for all 8 tables marked Done with commit
  SHA.

## Implementation
Specific files:
- `/Users/lubomir/Desktop/subenai/supabase/migrations/20260517000000_admin_hub_schema.sql` (appends CMS+config section after AH-1.5's governance block)
- `/Users/lubomir/Desktop/subenai/DEPLOY_SETUP.sql` (mirror)

## Tests
- Vitest at `tests/lib/supabase/cms-singletons.test.ts`: verify typed select shape
  for each singleton; assert client code reads `.eq('id', 1).single()` pattern.
- Integration spec at `e2e/integration/admin-hub/cms-singleton-enforcement.spec.ts`:
  via `supabaseAdmin`, attempt `INSERT INTO cms_header (id) VALUES (2)`; assert
  the CHECK constraint blocks it.
- data-testids: N/A.

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` rows updated with commit SHA.
- `CHANGELOG.md` — N/A.
- privacy / cookies docs — N/A.

## Code review
Fresh-context prompt:

> Review the CMS+config section in
> `/Users/lubomir/Desktop/subenai/supabase/migrations/20260517000000_admin_hub_schema.sql`.
> Confirm: (1) every singleton table has `CHECK (id = 1)`; (2) `cms_pages.slug` is
> UNIQUE; (3) RLS enabled on all 8 tables; (4) seed `INSERT ... ON CONFLICT DO
> NOTHING` rows are present for every singleton so AH-9 can read defaults; (5)
> `app_settings` PK is `key text` (not `id uuid`); (6) ESLint 0/0. Review only —
> do not modify code.

**Effort**: M
**Depends on**: AH-1.1
**Source in admin-hub**: `docs/DATABASE.md` §1 (CMS, Globálne settings)

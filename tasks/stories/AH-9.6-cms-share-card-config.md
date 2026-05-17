# AH-9.6 — Admin share-card config (`/admin/share-card`)

**Epic:** AH-9 — CMS + site header / footer / sitemap
**Effort:** M
**Status:** Backlog

## Goal
Port the admin-hub share-card config editor — controls the OG image template,
title fallback, and description fallback used when sharing test results.
Mock-only in this epic.

## OPEN QUESTION FOR USER
Per `tasks/PLAN-2026-05-17-admin-hub-integration.md` open question #7:
**should admin-hub's `share_card_config` merge with subenai's existing share
mechanism (used by the OG image generator on the results / podakovanie flows),
or stay separate?** This story assumes **stay separate** (admin-hub config is
read by admin-hub-side test sessions only; the existing `/zdielanie/*` and
`/podakovanie/*` OG paths are untouched). Confirm with user before merging.

## Acceptance criteria
- Route `/admin/share-card` exposes a single-form editor against
  `cms_share_card_config` (mock store).
- Save persists to mock store; lint 0/0.
- All ported files have `npx eslint --fix` applied.
- data-testids: `share-card-config-form`, `share-card-config-form-save`,
  `share-card-config-og-template-url`, `share-card-config-title-fallback`,
  `share-card-config-description-fallback`,
  `share-card-config-preview` (preview image).
- Slovak strings extended in `src/i18n/locales/sk/cms.json` (keys `shareCard.*`).
- FEATURE_MAP-admin-hub.md row `AH-9.6` marked `Done` with commit SHA.
- CHANGELOG entry (user-visible: yes).
- Existing subenai OG share routes untouched.
- Mock-only in this epic; AH-11 wires real Supabase.

## Implementation
- `cp admin-hub/src/routes/admin/share-card.tsx src/routes/admin/share-card.tsx`
- Path rewrites: `@/lib/admin/cms-store` → `@/lib/admin/cms-mock-store`;
  `@/lib/admin/cms-hooks` stays.
- `npx eslint --fix src/routes/admin/share-card.tsx`
- Extend `src/i18n/locales/sk/cms.json`.
- Add test-ids listed above.

## Tests
- Vitest: `tests/routes/admin/share-card.test.tsx`
  - Renders all fields with seeded values.
  - Save calls mock-store update.
  - Preview renders bound to current form state.
  - Validation rejects empty title fallback.

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` — mark row Done (`see git log`).
- `CHANGELOG.md` — user-visible entry.
- `src/content/legal/*.md` — N/A.

## Code review
Fresh-context: no Supabase imports; test-ids present; i18n under `cms`; existing
subenai OG share path untouched; mock-store only.

**Effort:** M
**Depends on:** AH-1 (DB types), AH-3, AH-10
**Source in admin-hub:** `src/routes/admin/share-card.tsx`

# AH-7.1 — User DSR submit (`app.legal.dsr`) + CONSENT_VERSION bump 1.3.0 → 1.4.0

**Epic:** [AH-7 — Governance: reports, respondents, audit, DSR](../PLAN-2026-05-17-admin-hub-integration.md#epic-map)
**Effort:** `L`
**Priority:** `P0`
**Status:** Backlog
**Depends on:** AH-1, AH-3. Must close before any other AH-7 story merges.
**Source in admin-hub:** `src/routes/app.legal.dsr.tsx`, `src/components/user/DsrSubmitForm.tsx`, `src/lib/platform/dsr.ts`

## Goal
Port the authenticated user DSR submission route under `/app/legal/dsr`, wire the form to the platform mock store, and ship the single CONSENT_VERSION bump (1.3.0 → 1.4.0) that covers the entire admin-hub integration. Banner re-shows once, privacy and cookies pages gain rows for the two new PII categories (platform user profiles, respondent intake data).

## Acceptance criteria
- `cp admin-hub/src/routes/app.legal.dsr.tsx src/routes/app.legal.dsr.tsx` plus dependent components; path rewrites `@/lib/platform/store` → `@/lib/platform/mock-store`; `npx eslint --fix` on every ported file.
- `data-testid`: `dsr-form-type-select`, `dsr-form-subject-input`, `dsr-form-details-textarea`, `dsr-form-submit-button`, `dsr-form-success-banner`, `dsr-form-error-banner`.
- Slovak strings in `src/i18n/locales/sk/governance.json` and registered in `src/i18n/resources.ts` (DSR types: access, rectification, erasure, restriction, portability, objection).
- `CONSENT_VERSION` in `src/lib/consent.ts` bumped from `1.3.0` to `1.4.0`. Banner copy explains the new platform surface (proposed: "Pridali sme platformu pre tvorbu vlastných testov a zdieľanie cez odkaz.").
- Cookies + privacy pages updated for two new PII categories: platform user profiles (creator accounts) and respondent intake data (name, email, custom fields).
- `dsr.md` (or equivalent legal content) updated to document the new in-app DSR submission path alongside the email contact.
- FEATURE_MAP-admin-hub.md row `routes/app.legal.dsr.tsx` marked Done with `see git log`.
- CHANGELOG entry (user-visible: yes) referencing the consent bump and new platform surface.
- Mock-only: server fn is a stub; AH-11 swaps to real `supabaseAdmin` write with audit insert.

## Implementation
- `cp admin-hub/src/routes/app.legal.dsr.tsx src/routes/app.legal.dsr.tsx`.
- `cp admin-hub/src/components/user/DsrSubmitForm.tsx src/components/user/DsrSubmitForm.tsx`.
- `cp admin-hub/src/lib/platform/dsr.ts src/lib/platform/dsr.ts` and rewrite `@/lib/platform/store` → `@/lib/platform/mock-store`.
- `npx eslint --fix` on every copied file.
- `src/lib/consent.ts` — bump `CONSENT_VERSION = "1.4.0"`; update banner copy string for new platform.
- `src/routes/privacy.tsx` — new section: platform user profiles (display name, email, role, retention) + respondent intake data (intake fields, retention, anonymization cron).
- `src/routes/cookies.tsx` — new matrix rows for platform auth session cookie + share-link tracking cookie (if any).
- Locate the legal markdown sources via `git grep CONSENT_VERSION src/` and adjacent route files; do not invent paths.
- New: `src/i18n/locales/sk/governance.json` + register in `src/i18n/resources.ts`.

## Tests
- Vitest `tests/routes/app/legal-dsr.test.tsx` — happy path (submit → success banner), validation (empty type → blocked), error path (mock store throws → error banner).
- Vitest `tests/lib/consent.test.ts` — existing consent suite stays green; new assertion: bumping version from a stored `1.3.0` triggers banner re-show.
- Vitest snapshot of the new banner copy at version `1.4.0`.
- Playwright `e2e/specs/app/dsr-submit.spec.ts` with POM `e2e/poms/app/DsrSubmitPage.ts` — authenticated user submits a request, success banner asserted.

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` — mark AH-7.1 row Done (`see git log`).
- `CHANGELOG.md` — version bump entry; this story owns the user-visible CONSENT line for the whole admin-hub integration.
- `src/content/legal/privacy.md` AND `src/content/legal/cookies.md` updated for new PII categories — owned here.
- `src/content/legal/dsr.md` (if it exists) updated for in-app DSR path.

## Code review (fresh context)
Reviewer must verify: CONSENT_VERSION is the ONLY bump in subenai's whole admin-hub integration and lands here; banner copy faithfully describes the new surface (platform + share-link respondent flow); privacy and cookies copy accurately reflects the two new PII categories with retention and legal basis; mock-only behaviour — no Supabase writes; data-testids present; i18n keys registered; ESLint 0/0 on touched files.

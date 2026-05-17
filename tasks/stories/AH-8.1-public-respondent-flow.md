# AH-8.1 — Public respondent flow `/t/$shareId` (no-auth, safe-projection, rate-limited)

**Epic:** [AH-8 — Public respondent flow](../PLAN-2026-05-17-admin-hub-integration.md#epic-map)
**Effort:** `L`
**Priority:** `P0`
**Status:** Backlog
**Depends on:** AH-1, AH-5, AH-7.1 (consent bump must precede any new PII surface going live)
**Source in admin-hub:** `src/routes/t.$shareId.tsx`, `src/components/respondent/TakeTestFlow.tsx`, `src/components/respondent/IntakeStep.tsx`, `src/components/respondent/QuestionStep.tsx`, `src/lib/public/take-test.functions.ts`, `src/lib/respondent/store.ts`

## Goal
Port the public, unauthenticated respondent flow at `/t/$shareId`. The route is served via `supabaseAdmin` with explicit safe-column projection, no auth cookie touched, rate-limited at the CF Pages Function edge, and wired in this epic to the admin-hub mock session store. Security is the headline acceptance criterion — see explicit checklist below.

## Acceptance criteria
- `cp admin-hub/src/routes/t.$shareId.tsx src/routes/t.$shareId.tsx` plus respondent components and intake/question step components.
- Path rewrites `@/lib/respondent/store` → `@/lib/respondent/mock-store`; `npx eslint --fix` on every copied file.
- `data-testid`: `respondent-flow-root`, `respondent-flow-intake-name`, `respondent-flow-intake-email`, `respondent-flow-intake-consent-checkbox`, `respondent-flow-intake-submit-button`, `respondent-flow-question-${n}-prompt`, `respondent-flow-question-${n}-answer-${a}`, `respondent-flow-next-button`, `respondent-flow-prev-button`, `respondent-flow-submit-button`, `respondent-flow-thank-you`, `respondent-flow-error-not-found`, `respondent-flow-error-rate-limited`.
- Slovak strings in `src/i18n/locales/sk/respondent-flow.json` (intake field labels, consent copy referencing AH-7.1 banner version 1.4.0, navigation buttons, thank-you, error states) and registered in `src/i18n/resources.ts`.
- **No-auth**: route does NOT apply `requireSupabaseAuth`; incognito smoke completes the full flow with NO auth cookie set or read.
- **Safe-column projection**: server fn at `src/lib/respondent/take-test.functions.ts` selects ONLY `id, title, description, intake_fields, gdpr_purpose, allow_behavioral_tracking, status` from `tests`. Never returns `owner_id`, `password_hash`, `segmentation`, or any column not in the allowlist.
- **`supabaseAdmin` boundary**: imported only in `src/lib/respondent/take-test.functions.ts` (a `.server.ts`-suffixed file or `.functions.ts` inside a `createServerFn` handler). ESLint `no-restricted-imports` rule (added in AH-1) covers `client.server` outside `*.server.ts`.
- **Rate limit**: documented at 10 submissions / 5 min / IP via CF Pages Function wrapper. This story leaves a TODO in the server fn referencing AH-11 for the actual `functions/_middleware.ts` wiring; do NOT edit `functions/` here.
- **Mock-only**: server fn is a stub that resolves against the admin-hub mock session store. TODO comment references AH-11 for real `supabaseAdmin` writes with `forbid_session_score_changes` trigger.
- Invalid share-id → 404 (Slovak error copy in `respondent-flow.json`).
- FEATURE_MAP-admin-hub.md row `routes/t.$shareId.tsx` marked Done with `see git log`.
- CHANGELOG entry (user-visible: yes — new public surface).

## Implementation
- `cp admin-hub/src/routes/t.$shareId.tsx src/routes/t.$shareId.tsx`.
- `cp admin-hub/src/components/respondent/TakeTestFlow.tsx src/components/respondent/TakeTestFlow.tsx`; same for `IntakeStep.tsx`, `QuestionStep.tsx`.
- `cp admin-hub/src/lib/respondent/store.ts src/lib/respondent/mock-store.ts`; rewrite imports across copied files.
- New: `src/lib/respondent/take-test.functions.ts` — skeleton `createServerFn` with Zod input validator `{ shareId: z.string().min(8).max(64) }`, mock-flagged resolver, explicit TODOs for AH-11: (1) swap mock to `supabaseAdmin` with safe-column projection from `INTEGRATION.md` §6, (2) wire rate-limit middleware at `functions/_middleware.ts`.
- `npx eslint --fix` on every copied file.
- New: `src/i18n/locales/sk/respondent-flow.json` + register in `src/i18n/resources.ts`.
- Do NOT edit `functions/` in this story; leave a clear TODO for AH-11.

## Tests
- Vitest `tests/routes/t-shareId.test.tsx` — happy (valid share-id renders intake → questions → thank-you), edge (malformed share-id < 8 chars → 404, empty intake submit blocked, missing consent blocked).
- Vitest `tests/lib/respondent/take-test-functions.test.ts` — input validator rejects malformed shareId; mock resolver returns only the safe-column allowlist (assert keys of returned object are a strict subset).
- Playwright `e2e/specs/respondent/take-test-public.spec.ts` with POM `e2e/poms/respondent/TakeTestPage.ts`. Runs in `storageState: undefined` (no auth cookie). Covers happy path (intake → answer all → thank-you), invalid share-id (404 page), and rate-limit (mocked at 11th submit — assert error banner copy). POM-only locators per CLAUDE.md.
- Incognito smoke assertion in the e2e: no cookie named `sb-*` or `auth-*` is present at any step of the flow.

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` — mark AH-8.1 row Done (`see git log`).
- `CHANGELOG.md` — entry (user-visible: yes — new public surface).
- privacy/cookies — respondent intake data category was added in AH-7.1; verify the new public route is mentioned in the privacy section.

## Code review (fresh context)
Explicit security checklist the reviewer must tick:
- No `supabaseAdmin` import outside `*.server.ts` / `*.functions.ts`.
- Safe-column projection: returned object keys are a strict subset of `{ id, title, description, intake_fields, gdpr_purpose, allow_behavioral_tracking, status }`. No `owner_id`, no `password_hash`, no `segmentation` reachable from anon client.
- Route does NOT call `requireSupabaseAuth` and incognito flow sets/reads no auth cookie.
- Rate-limit middleware planned with explicit TODO referencing AH-11 (`functions/_middleware.ts`); not yet wired in this story.
- ESLint `no-restricted-imports` rule for `client.server` is enforced on the touched files.
- All data-testids present; i18n keys registered; ESLint 0/0.

Files: `src/routes/t.$shareId.tsx`, `src/components/respondent/TakeTestFlow.tsx`, `src/components/respondent/IntakeStep.tsx`, `src/components/respondent/QuestionStep.tsx`, `src/lib/respondent/mock-store.ts`, `src/lib/respondent/take-test.functions.ts`, `src/i18n/locales/sk/respondent-flow.json`, `src/i18n/resources.ts`.

# Definition of Done

> **Purpose.** Single canonical checklist for *what must be true before something
> is marked done.* Written once, consulted at every story, every feature merge,
> every prod deploy. No "we know it from memory" — DoD is an explicit contract
> between product owner, developer, and reviewer.
>
> **Read top-to-bottom.** § 1 = ready. § 2 = one story. § 3 = whole feature
> before merge. § 4–7 are reference material indexed by the type of change.

---

## 0. Hierarchy of "done"

```
            ┌────────────────────────────────────────┐
            │  Feature live in production            │
            │  ↑                                     │
            │  Post-merge verification (§ 6)         │
            │  ↑                                     │
            │  PR merged into main (§ 5 green)       │
            │  ↑                                     │
            │  Feature DoD (§ 3) — whole epic ✅     │
            │  ↑                                     │
            │  Story DoD (§ 2) — story-by-story ✅   │
            │  ↑                                     │
            │  Definition of Ready (§ 1)             │
            └────────────────────────────────────────┘
```

No story is marked Done without § 2. No epic merges without § 3. No prod
deploy is "successful" without § 6.

---

## 1. Definition of Ready (DoR) — before a story starts

Before the first commit on the story:

- [ ] **Acceptance criteria** written, reviewed by PO + 1 reviewer
      (independent check that ACs are objectively testable).
- [ ] **Dependencies resolved** — either prior stories are ✅ Done, or
      the parallel plan makes sense and won't deadlock.
- [ ] **Open questions answered** — no `?` left in decision points.
- [ ] **Privacy / cookies / GDPR impact assessed** — if the story
      introduces a new data category or processor, the plan covers
      `/privacy`, `/cookies` updates and a possible `CONSENT_VERSION`
      bump.
- [ ] **Schema impact assessed** — if the story changes the DB, the
      plan lists the migration file path, new column / index / RLS
      policy, and a backward-compat strategy.
- [ ] **Story has its own feature branch name + commit prefix**
      (Conventional Commits: `feat(scope): …`, `fix(scope): …`,
      `chore(scope): …`).

---

## 2. Story DoD — per user story

Every story file in `tasks/stories/` carries a `Subtasks` block with four
sections (Implementation, Tests, Documentation, Code review). The story
is not marked ✅ Done until **all four** are satisfied:

### 2.1 Implementation

- [ ] **Acceptance criteria met** — every AC verified by a manual smoke
      pass in the dev stack (`npm run dev` + `npm run dev:api`).
- [ ] **Senior-level code style** per `.claude/CLAUDE.md` north star —
      smallest correct change, no speculative scaffolding, no comments
      that restate code.
- [ ] **Slovak in UI strings** / English in code identifiers (per
      `.claude/CLAUDE.md` § Style).
- [ ] **No `// TODO`, `// FIXME`, `console.log`, `debugger`** left in
      the PR (CI grep at merge time).
- [ ] **No new ESLint warnings** — `npm run lint` ends 0/0.
- [ ] **TypeScript strict** — no new `any`, `// @ts-ignore`,
      `// @ts-expect-error` without an inline comment explaining why.
- [ ] **No `--no-verify` / `--no-gpg-sign`** in commit history.

### 2.2 Tests (unit + component)

> *Story-level tests = Vitest. Integration + e2e Playwright are added at
> the epic level (§ 3.2 / § 3.3).*

- [ ] **Unit tests** for pure logic (`src/lib/**`) — happy path, edge
      cases, error paths. Vitest + RTL.
- [ ] **Component tests** for new React components (rendering, ARIA,
      user interaction via `@testing-library/user-event`).
- [ ] **Function tests** for new CF Pages Functions (`tests/functions/*`)
      — request shape validation, success path, error responses, rate
      limit, RLS edge cases. Supabase REST mocked via `vi.spyOn(fetch)`.
- [ ] **DB schema tests** for new migrations (`tests/db/*`) — verify the
      migration + DEPLOY_SETUP.sql contain the expected constraints /
      RLS / indexes / triggers (regex assertions over the SQL strings).
- [ ] **Coverage** — every new publicly-exported function has ≥ 1 test,
      every new file has at least a smoke render test.
- [ ] **No `.skip` / `.only`** in any test file in the PR.

### 2.3 Documentation

- [ ] **Story file updated** — Status: ✅ Done (YYYY-MM-DD), all
      subtasks ticked, deviations from AC documented in the story
      file (not in the PR comment).
- [ ] **PLAN file** in `tasks/PLAN-*.md` — story status in the Epic &
      Story map: ✅ Done.
- [ ] **`tasks/stories/README.md`** — completion counts updated; if the
      epic is now 100 %, mark it ✅ in the overview table.
- [ ] **`CHANGELOG.md`** — `[Unreleased]` section gains one user-facing
      line. Slovak, no internal jargon, no file paths, no SDK versions.
- [ ] **`/privacy` + `/cookies`** updated if the feature adds a new
      data category or processor.
- [ ] **`CONSENT_VERSION`** bumped in `src/lib/consent.ts` — but only
      ONCE per epic batch (collect all changes into a single bump at
      epic-end so the banner doesn't re-show after every story).
- [ ] **Author / runbook guides** (`/skoly`, `tasks/E*-runbook.md`)
      updated if the story changes an authoring workflow.

### 2.4 Code review (fresh context)

- [ ] **Reviewer doesn't know the premise** — story prompt must stand
      alone (no "Lubomír mentioned in Slack that…").
- [ ] **Reviewer runs the PR branch locally** — verifies the smoke
      flow through the UI, not by reading the diff alone.
- [ ] **Zero MAJOR+ findings** (categories: BLOCKER, CRITICAL, MAJOR,
      MINOR, NIT). MAJOR and above must be fixed before merge.
- [ ] **For security-sensitive stories** (auth, RLS, JWT, payments) the
      review explicitly covers: no PII in URLs / logs, no secret in the
      bundle, RLS policies verified against the anon key.

---

## 3. Feature / Epic DoD — before merging the whole epic into `main`

All stories in the epic are ✅ Done (§ 2 satisfied for each). Before
merging the PR into main:

### 3.1 Manual integration happy path

- [ ] Feature works **end-to-end** in the local dev stack (including CF
      Functions + Supabase test project, not just Vite).
- [ ] **Cross-browser smoke** — Chromium minimum, ideally Firefox + Safari
      for UI features (especially Stripe iframe / 3DS challenge / dialog
      API).
- [ ] **Mobile smoke** — viewport 375×667, key flows still functional.

### 3.2 Playwright integration tests (`e2e/integration/`)

> *Added once the feature is fully implemented. Integration tests verify
> the HTTP contract of CF Functions via the `request` fixture — no
> browser, but against the real CF runtime over HTTP.*

- [ ] **Test plan** in `specs/<area>/<feature>.md` written via the
      planner agent (`.claude/agents/playwright-test-planner.md`) —
      contains Happy paths / Negative scenarios / Edge cases.
- [ ] **API integration spec** in `e2e/integration/<domain>/*.spec.ts`:
  - Each new `/api/*` endpoint: validation rejects, success path,
    error responses, status codes, response shape.
  - Auth flows: cookie handling, JWT lifecycle, role mismatch.
  - Rate limit boundaries (at limit, one over).
- [ ] **Spec maps 1:1 to the test plan** — every TC in the plan has a
      spec; if not, document why (e.g. "ergonomic check — covered by
      unit test").
- [ ] `npm run e2e:integration` is green.

### 3.3 Playwright e2e tests (`e2e/specs/`)

> *Browser-driven full-stack scenarios. Update existing specs or add new
> ones following the plans in `specs/<area>/`.*

- [ ] **Existing e2e specs** in the affected area updated when the
      feature changes UI / route / data shape (locators, asserts, route
      paths).
- [ ] **New e2e specs** in `e2e/specs/<area>/` for new user flows —
      POMs in `e2e/poms/<area>/`, fixtures in `e2e/fixtures/` if a new
      preset is needed (e.g. authenticated edu author).
- [ ] **Mocks** in `e2e/mocks/` updated if the feature adds calls to
      new endpoints (used for UI error-state tests).
- [ ] **Coverage** — happy path of every user flow + at least 2 edge
      cases (typically "network error" + "permission denied").
- [ ] `npm run e2e:browser` is green against the local Vite + Wrangler
      stack.

### 3.4 Schema + secrets ready for prod

- [ ] **Migration** in `supabase/migrations/{timestamp}_{name}.sql` —
      code committed but **not applied** to prod (per `.claude/CLAUDE.md`
      DB migration rule). PR description contains a step-by-step
      "post-merge SQL run" instruction.
- [ ] **`DEPLOY_SETUP.sql`** mirrors the migration — bootstrap file is
      always in sync with the production schema.
- [ ] **Supabase types** (`src/integrations/supabase/types.ts`) hand-
      maintained for new tables / columns / views / RPCs.
- [ ] **CF Pages env vars** — PR description lists every new env var
      (Production + Preview scope) and the redeploy required to load
      them. No secrets committed to the repo.

### 3.5 Privacy & legal

- [ ] **Privacy retention table** (`src/routes/privacy.tsx`) has a row
      for every new data category with legal basis + retention period.
- [ ] **`CONSENT_VERSION`** bumped in a single commit; banner copy
      reflects the reason for the re-show.
- [ ] **Stripe / Resend / other processor added** — listed in the
      "Recipients & processors" section, DPA documentation stored in
      `tasks/E*-runbook.md` or the `/skoly` page.
- [ ] **GDPR role** explicit (controller vs processor) when the feature
      changes the data flow between am.bonum and third parties or
      authors.

### 3.6 Accessibility (a11y)

- [ ] **Keyboard flow** verified — Tab / Shift-Tab / Space / Enter / Esc
      — every feature interaction usable without a mouse.
- [ ] **ARIA attributes** — labelledby, aria-required, aria-invalid,
      aria-live, role on non-semantic elements (modal dialog, switch).
- [ ] **Focus trap in modals** + return focus on close.
- [ ] **No axe-core finding ≥ MODERATE** on the feature's key pages
      (manual via DevTools, ideally automated through Playwright e2e
      with `@axe-core/playwright`).
- [ ] **prefers-reduced-motion** respected for new animations.

### 3.7 Performance (informational, hard gate only on regression)

- [ ] **Bundle delta** — `npm run build` after vs before; `index.js`
      gzip didn't grow by > 20 KB without justification.
- [ ] **No tracker / analytics** outside opt-in consent —
      `npm run audit:bundle` is green.
- [ ] **Lighthouse smoke** on the feature's main page — Performance
      score ≥ 90, no LCP > 2.5 s.
- [ ] **No N+1 fetch** — DevTools Network tab shows the expected number
      of requests on page load.

### 3.8 Security review (mandatory for auth / payments / PII stories)

- [ ] **No PII in URLs** — query params, path segments. If unavoidable,
      it's a crypto-strong identifier (UUID, 122-bit share_id).
- [ ] **No secrets in `src/`** — service role keys, JWT secrets, Stripe
      live keys live only in `.dev.vars` / CF env vars.
- [ ] **JWT validation** — secret check, signature, expiry, role match.
- [ ] **RLS verified** — anon has no unintended SELECT/UPDATE/DELETE on
      PII rows. Tested via a Playwright integration spec.
- [ ] **Rate limiting** — every public `/api/*` endpoint has a per-IP
      limit; brute-forceable endpoints (password verification) have a
      per-(IP, target) limit.
- [ ] **CSP** — `public/_headers` covers new third-party domains
      (Stripe, Resend, …) with explicit `script-src` / `connect-src`
      entries only.
- [ ] **CSRF** — state-changing endpoints check origin or use a
      double-submit cookie pattern (Stripe webhook differs — uses a
      signature).

---

## 4. Test pyramid — what belongs where

| Aspect | Layer | Tool | Folder | Cadence |
|---|---|---|---|---|
| Pure logic / math / utilities | Unit | Vitest | `tests/lib/*`, `tests/components/*` | per-story |
| React component rendering / interaction | Unit/Component | Vitest + RTL | `tests/components/*` | per-story |
| CF Function with mocked Supabase | Integration (fast) | Vitest | `tests/functions/*` | per-story |
| Migration SQL contract | Integration | Vitest grep | `tests/db/*` | per-story |
| `/api/*` HTTP contract against CF runtime | Integration (HTTP) | Playwright `request` | `e2e/integration/<domain>/*` | per-feature |
| Browser user flow (full stack) | E2E | Playwright `page` | `e2e/specs/<area>/*` | per-feature |
| OWASP attack surface | Security | Playwright + custom | `security/` | weekly / pre-release |
| Lighthouse / Web Vitals / load | Performance | Lighthouse-CI / k6 | `performance/` | per-release |

**Push-up rule:** if a behavior can be covered by a unit test, do it
there. Integration tests cover module-to-module contracts; e2e covers
browser-side behavior. Never duplicate the same assertion across three
layers.

---

## 5. Pre-merge gates (CI checks before merging into `main`)

> *Hard gates — anything red == "do not approve".*

- [ ] `npm run lint` → **0 errors / 0 warnings**.
- [ ] `npm test` → all Vitest suites green, no `it.skip` / `it.only`.
- [ ] `npm run build` → ✓ no errors / warnings.
- [ ] `npm run e2e:integration` → green (against the dev preview deploy
      or the local stack).
- [ ] `npm run e2e:browser` → green (smoke minimum, full suite when the
      feature changes UI).
- [ ] `npm run audit:bundle` → no unexpected third-party domains in `dist/`.
- [ ] **PR description** contains:
  - Summary of changes.
  - Verification commands and their output (pasted).
  - Post-merge deploy steps (env vars, SQL migrations, redeploy needs).
  - Test plan checklist for the reviewer.

---

## 6. Post-merge verification (after deploy to prod)

> *Without this step "merged" ≠ "live". CF Pages auto-deploy ≠ production
> readiness — a successful build does not guarantee runtime success.*

### 6.1 Smoke check within 5 minutes of deploy

- [ ] Production URL key routes return 200 (not 500 from a missing env
      var or migration):
  ```bash
  for path in / /test /testy /skolenia /podpora /test/zostav /skoly; do
    echo "$path $(curl -s -o /dev/null -w '%{http_code}' https://subenai.sk$path)"
  done
  ```
- [ ] New `/api/*` endpoint returns the expected status for valid /
      invalid requests (smoke via `curl`, not a manual form).
- [ ] **CF Pages dashboard → Functions → Logs** — no 500 / unhandled
      exception in the past hour.

### 6.2 Migrations + secrets applied

- [ ] **DB migration run** (Supabase SQL Editor or CLI) — verified via
      an `information_schema` query (every migration includes a
      self-check SQL snippet in the PR description).
- [ ] **CF Pages env vars** registered in Production + Preview scope
      AND a redeploy has run (env vars are read at deploy, not at
      runtime).

### 6.3 Monitoring + alerting

- [ ] **Sentry / log aggregation** — no new error pattern in the past
      hour (today: manual via CF logs; future: auto alert).
- [ ] **Real-user metrics** — Web Vitals from analytics (when marketing
      consent is on) haven't regressed.
- [ ] **Stripe dashboard** (when the feature touches payments) — test
      transactions succeeded, no `payment_intent.payment_failed` dump.

### 6.4 Rollback plan ready

- [ ] **Revert PR** identified (single commit / merge commit), the
      tester knows how to revert via the GitHub UI or
      `git revert <sha>`.
- [ ] **Migration rollback** documented (down migration or manual SQL
      drop) — Supabase has no native migrate-down, so write one
      explicitly when the feature adds destructive changes.
- [ ] **Feature flag** considered for big-bang launches — if a
      `localStorage` flag or CF env var can gate the new flow, include
      it.

---

## 7. Cross-cutting concerns — opt-in checklists by change type

> *Answer "yes" to a trigger → run the corresponding sub-section.*

### 7.1 Is the DB schema changing?

- [ ] Migration in `supabase/migrations/{timestamp}_{name}.sql`
      (idempotent, `IF NOT EXISTS` / `DROP IF EXISTS`).
- [ ] `DEPLOY_SETUP.sql` updated.
- [ ] `src/integrations/supabase/types.ts` extended for new columns.
- [ ] RLS policy for new tables (no table without RLS).
- [ ] `forbid_attempt_score_changes` trigger NOT weakened (project rule
      from `.claude/CLAUDE.md`).
- [ ] Retention cron (pg_cron) for any new PII columns.

### 7.2 Adding a new `/api/*` endpoint?

- [ ] CF Pages Function in `functions/api/<name>.ts`.
- [ ] Per-IP rate limit (via `_lib/security.ts`).
- [ ] Validation: shape + types + reasonable lengths.
- [ ] Error handling: no SQL error message leaks into the response body.
- [ ] Vitest integration test (`tests/functions/<name>.test.ts`).
- [ ] Playwright integration test
      (`e2e/integration/<domain>/<name>.spec.ts`).
- [ ] Mocks (`e2e/mocks/api/<name>.ts`) for UI specs that simulate
      server responses.

### 7.3 Adding a new route in `src/routes/`?

- [ ] **TanStack file-based routing** — file path = URL path. Filename
      conventions: `kebab-case`, `$param` for dynamic, `.index` for
      defaults.
- [ ] Meta tags: `<title>`, description, robots (`noindex` for
      user-specific pages).
- [ ] **Sitemap** (`scripts/generate-sitemap.mjs`) updated for public
      routes.
- [ ] Header / footer link added when the feature is meant to be
      discoverable.
- [ ] E2E spec coverage for the route's happy path.

### 7.4 Collecting / changing PII?

- [ ] Privacy page section + retention row.
- [ ] CONSENT_VERSION bump (once per epic).
- [ ] RLS policy blocks anon SELECT on PII rows.
- [ ] Insert / update path goes through a CF Function with the service
      role (anon cannot insert PII rows).
- [ ] 12-month auto-anonymization via pg_cron when applicable.
- [ ] Disclosure paragraph + opt-in checkbox in the UI before
      collection.

### 7.5 Integrating a third-party service (Stripe, Resend, …)?

- [ ] CSP `connect-src` / `script-src` extended in `public/_headers`.
- [ ] Privacy: new processor added in the "Recipients" section.
- [ ] Runbook in `tasks/E*-runbook.md` (refund flow, dispute, retry).
- [ ] Webhook signature verification (no unverified inbound calls).
- [ ] Test-mode keys in `.dev.vars`, live keys only in CF env vars.

---

## 8. Quick reference — the common scenarios

### "I'm adding a new story to an existing epic"

1. Write the story file in `tasks/stories/E<N>.<m>-<slug>.md` following
   the convention of existing stories.
2. Satisfy § 1 (DoR).
3. Work through § 2 (Story DoD) — implementation + unit tests + docs +
   CR.
4. Mark the story ✅ Done in: story file + PLAN epic map +
   `tasks/stories/README.md`.
5. **Don't merge alone** — the story waits for the rest of the epic
   (§ 3).

### "The whole epic is done, time to PR"

1. All stories satisfy § 2.
2. Satisfy § 3 (Feature DoD) — integration tests + e2e tests + schema +
   privacy + a11y + perf + security review.
3. Run § 5 (Pre-merge gates) locally; paste the outputs into the PR
   description.
4. PR review per `.claude/CLAUDE.md` workflow rules.
5. After merge, run § 6 (Post-merge verification).

### "Hotfix to prod (security / privacy)"

1. Branch from `main` (even though it's not an epic).
2. Smallest possible change — single-purpose commit.
3. § 2 trimmed to: implementation + unit test (when possible) + CR in
   fresh context.
4. § 5 (lint + tests + build) is mandatory.
5. PR description explicitly states "hotfix" and CVSS / impact.
6. § 6 within 15 minutes of deploy.

### "Tech-debt cleanup (refactor with no user-visible change)"

1. § 1 DoR is looser — no new ACs.
2. § 2 implementation + tests; § 2.3 docs minimum (CHANGELOG line if
   the user-visible bundle delta is meaningful).
3. § 3 — integration / e2e only when the refactor changes an API
   contract.
4. § 5 + § 6 like any PR.

---

## 9. Anti-patterns — what NOT to do

- ❌ "Tests pass locally, CI will catch it" → always run lint + test +
  build locally before opening a PR.
- ❌ "This PR doesn't need docs, the code is self-explanatory" →
  CHANGELOG is for users, not developers; always at least one line.
- ❌ "We'll bump CONSENT_VERSION every story" → batch it at epic-end.
- ❌ "I'll run the migration manually when needed" → always documented
  in the PR description with step-by-step instructions.
- ❌ "The e2e test will cover this flow, no unit test needed" → unit
  tests are 100× faster and an order of magnitude easier to debug.
- ❌ "The reviewer will catch it" → reviewer runs the branch, not just
  reads the diff.
- ❌ "I'll write a rollback plan when needed" → rollback plan in the PR
  before merge.
- ❌ "RLS will handle it" → RLS is the last line of defense, not the
  only one. Validation in the CF Function + CHECK constraint in the DB
  + RLS = defense in depth.

---

**Last revised:** 2026-05-01.

This document is living — when DoD reveals a missing category (e.g. the
first security / performance test surfaces the need for a new section),
update it in the same PR that introduces the new practice.

# `e2e/` — Playwright integration + browser tests

Two Playwright projects share this directory:

| Project | What | Where | Speed |
|---|---|---|---|
| `integration` | API-level tests using `request` fixture (no browser) | `e2e/integration/<domain>/*.spec.ts` | fast (~10–100 ms / test) |
| `e2e-chromium` | Browser-driven full-stack scenarios | `e2e/specs/<area>/*.spec.ts` + root `seed.spec.ts` | slow (~1–30 s / test) |

## Folder layout

```
e2e/
├── README.md                ← you are here
├── seed.spec.ts             ← Playwright agent's environment seed
│
├── poms/                    ← Page Object Model — locators + actions per feature
│   ├── BasePage.ts          (shared navigation + waitForAppShell)
│   ├── shared/              (ConsentBanner, SiteHeader, Footer)
│   ├── quiz/                (HomePage, TestFlowPage, ResultsPage)
│   ├── composer/            (ComposerPage, EduSuccessDialog, …)
│   └── edu/                 (IntakePage, DashboardPage, …)
│
├── fixtures/                ← test.extend() — DI for POMs and presets
│   ├── base.ts              (canonical `test` import for specs)
│   └── consent.ts           (primeConsent — pre-seed cookie consent)
│
├── mocks/                   ← page.route() helpers + data factories
│   ├── api/                 (stubs for /api/* CF Functions)
│   ├── supabase/            (Supabase REST stubs)
│   ├── stripe/              (Stripe checkout/portal stubs)
│   └── data/                (factories: makeRespondent, makeTestSetSeed)
│
├── integration/             ← Playwright API-only — NO `page` fixture
│   ├── auth/                (verify-author-password, begin/finish-edu-attempt)
│   ├── attempts/            (results-data, delete-edu-respondent)
│   ├── stripe/              (checkout, portal)
│   └── webhooks/            (stripe-webhook signature handling)
│
└── specs/                   ← Browser-driven e2e — uses `test` from fixtures/base.ts
    ├── quiz/  composer/  edu/  courses/  test-packs/
    └── sponsorship/  consent/  cross-cutting/
```

## Conventions

### Specs (`specs/<area>/*.spec.ts`)

```ts
import { test, expect } from "../../fixtures/base";
import { primeConsent } from "../../fixtures/consent";

test.beforeEach(async ({ context }) => {
  await primeConsent(context, "all");
});

test("CTA opens the quiz", async ({ home }) => {
  await home.open();
  await home.clickStart();
  await expect(home.heading).toBeVisible();
});
```

Rules:
- **Always import `test` from `../../fixtures/base.ts`**, never from `@playwright/test`. The composed fixture injects POMs.
- **One spec file = one feature area**. Don't bundle quiz + composer in one file. Mirror the spec plan in `specs/<area>/<feature>.md`.
- **Specs are stateless** — every test runs with a fresh browser context. Use `test.beforeEach` for setup, never module-level globals.
- **Slovak strings verbatim from production UI** — the planner agent enforces this in `.claude/agents/playwright-test-planner.md`.

### Integration (`integration/<domain>/*.spec.ts`)

```ts
import { test, expect } from "@playwright/test";
import { makeRespondent } from "../../mocks/data/respondentFactory";

test("rejects honeypot field", async ({ request }) => {
  const r = await request.post("/api/begin-edu-attempt", {
    data: makeRespondent({ hp_url: "http://spam" }),
  });
  expect(r.status()).toBe(400);
  expect(await r.json()).toEqual({ error: "spam_detected" });
});
```

Rules:
- **Use `request` fixture, not `page`.** No browser launches.
- **Real backend** — runs against `BASE_URL` (default localhost:8080 → Vite proxy → wrangler:8788).
- For deterministic tests against external services (Stripe, Resend), use `request.route()` to intercept upstream calls if necessary. Most CF Functions hit only Supabase, which we exercise as part of the contract.

### POMs (`poms/<area>/*.ts`)

```ts
import { BasePage } from "../BasePage";

export class HomePage extends BasePage {
  static readonly PATH = "/" as const;

  get heading() {
    return this.page.getByRole("heading", { level: 1 }).first();
  }

  async open() {
    return this.goto(HomePage.PATH);
  }
}
```

Rules:
- **Locators as getters** (lazy, re-evaluated after navigation).
- **Methods = single user intent** — `clickStart()`, not `clickButtonAndWaitForResponse()`.
- **No assertions inside POMs.** Specs use `expect(...)`.
- **Compose via fixtures**, not inheritance, when a feature reuses a shared component (ConsentBanner, SiteHeader).

### Mocks (`mocks/<kind>/*.ts`)

```ts
export async function stubBeginEduAttempt(page: Page, stub: BeginEduAttemptStub) {
  await page.route("**/api/begin-edu-attempt", async (route) => {
    await route.fulfill({ status: stub.status, body: JSON.stringify(stub.body) });
  });
}
```

Rules:
- **One file per endpoint / collection** — `mocks/api/begin-edu-attempt.ts`, not `mocks/api/all.ts`.
- **Factories for data** in `mocks/data/` — return overrideable defaults so a single spec can construct a payload that targets the edge case it's about.
- Mocks are **opt-in**: a spec uses real backend by default, calls `stubXxx(page, …)` only when the test is about UI behaviour under specific server states.

## Running

| Command | What runs |
|---|---|
| `npm run e2e` | Both projects (integration + browser) |
| `npm run e2e:integration` | API-only project, fast |
| `npm run e2e:browser` | Browser-only project, full UI |
| `npm run e2e:ui` | Playwright UI mode (debugging) |
| `npm run e2e:headed` | Browser project with visible browser |
| `npm run e2e:report` | Open last HTML report |

Override base URL:

```bash
BASE_URL=https://subenai.sk npm run e2e:browser
```

## What does NOT live here

- **Vitest unit/integration tests** → `tests/` (different runner, no browser).
- **Security tests** → `security/` (Playwright + custom OWASP-style checks; placeholder today).
- **Performance tests** → `performance/` (Lighthouse-CI + Web Vitals; placeholder today).

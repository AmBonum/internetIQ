# `performance/` — performance tests (placeholder)

Reserved top-level directory for performance-focused tests. **Not yet implemented.**

## Why a separate directory?

Performance tests are a different beast from functional ones:

- They measure **distributions** (p50/p95/p99) — single-shot pass/fail like e2e doesn't apply.
- They need **stable environments** — running on a developer laptop alongside HMR ruins the numbers.
- They run **less frequently** (per release, weekly in CI) and have **different reporters** (trends over time, not red/green).
- They surface **regressions** (this build is 200 ms slower than last) — needs a baseline store, not a snapshot.

## Planned tooling

| Concern | Tool | Notes |
|---|---|---|
| Lighthouse audits | `@lhci/cli` | CI-friendly Lighthouse runs against built bundle. Track LCP, CLS, TBT, accessibility, SEO scores per route. |
| Real-user web vitals | `web-vitals` library + analytics | Out of test runner — instrumented in production for trends. |
| Load testing | `k6` (or `artillery`) | Simulate burst on `/api/begin-edu-attempt` and verify rate-limit holds + p95 latency stays acceptable. |
| Bundle size budget | Existing `scripts/check-bundle-no-trackers.sh` + new size budget script | Fail CI if `index.js` gzip > X KB. |
| Page-load Playwright | Playwright with `tracing` + `Performance` API | Custom traces per critical route. |

## Planned structure (when first test lands)

```
performance/
├── README.md
├── lighthouse/              ← .lighthouserc.cjs config + per-route assertions
├── load/                    ← k6 scripts: edu-intake-burst.js, results-data-rps.js
├── budgets/                 ← bundle-size budgets, perf.budget.json
└── traces/                  ← optional Playwright Performance API recordings
```

## When to add the first test

Trigger conditions (whichever comes first):

1. A page (route) shows up slow in Real User Monitoring (LCP > 2.5 s).
2. CF Pages dashboard reports `cpuTime` p95 > 50 ms for any function.
3. Bundle size grows by > 20 % between releases.
4. Pre-launch readiness for a high-traffic event (e.g. school year start, marketing campaign).

Until then, performance is checked manually:

- `npm run build` — sized output in console.
- DevTools Lighthouse on `/`, `/test/zostav`, `/test/zostava/$id/vysledky` after major UI changes.
- `npm run audit:bundle` (existing) — confirms no third-party trackers slipped into `dist/`.

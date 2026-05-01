# `security/` — security tests (placeholder)

Reserved top-level directory for security-focused tests. **Not yet implemented.**

## Why a separate directory?

Security tests have a different cadence and tooling than e2e:

- Run **less frequently** (weekly in CI, on demand before release).
- Different **failure semantics** — a failing security test is a release-blocker; a flaky e2e is a known annoyance.
- Often **need elevated network access** (raw HTTP, headers, cookie tampering) which Playwright supports but pollutes the e2e suite if mixed in.
- May require **separate fixtures** (intentionally invalid JWTs, expired cookies, oversized payloads) that don't belong in the e2e factories.

## Planned tooling

| Concern | Tool | Notes |
|---|---|---|
| Auth bypass / RLS holes | Playwright `request` + custom payloads | Verify anon cannot read edu rows even with crafted UUIDs |
| JWT manipulation | Playwright + jsonwebtoken (node) | Forge tokens with wrong secret/role; expect 401 across endpoints |
| Rate-limit bypass | Playwright `request` with IP rotation header | Confirm 429 triggers regardless of `cf-connecting-ip` value |
| XSS / CSRF | Playwright DOM injection in browser context | Submit malicious payload, assert no script execution |
| Header / CSP audit | curl + content-security-policy parser | Snapshot CSP for every public route, fail on regression |
| Dependency CVE scan | `npm audit` + GitHub Dependabot | Out of test runner — CI step |
| OWASP ZAP baseline | OWASP ZAP CLI | Scheduled run against staging |

## Planned structure (when first test lands)

```
security/
├── README.md
├── fixtures/                ← intentionally-evil payload factories
├── auth/                    ← JWT forgery, role escalation, cookie tampering
├── rls/                     ← RLS policy verification (anon edu reads, etc.)
├── injection/               ← XSS, SQL-look injection, path traversal
├── headers/                 ← CSP, HSTS, X-Frame-Options, etc.
└── rate-limits/             ← burst, distributed, header spoofing
```

## When to add the first test

Trigger conditions (whichever comes first):

1. A real security incident or near-miss in production logs.
2. The next major feature that changes the auth surface (multi-tenant edu, OAuth, etc.).
3. A periodic audit milestone (every 6 months in maintenance mode).

Until then, security is exercised opportunistically inside `e2e/integration/` (e.g. `verify-author-password` brute-force test) — duplicate or migrate when this directory becomes active.

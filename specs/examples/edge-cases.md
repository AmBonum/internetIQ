# Edu password gate — edge-case-heavy test plan (EXAMPLE)

**Area:** `specs/examples/`
**Component(s) under test:** `src/components/composer/edu/dashboard/AuthorPasswordGate.tsx`, `functions/api/verify-author-password.ts`, RPC `verify_test_set_password`
**Routes:** `/test/zostava/$id/vysledky`
**API endpoints:** `POST /api/verify-author-password`, `DELETE /api/verify-author-password`
**Data dependencies:** `test_sets.author_password_hash` (bcrypt via `pgcrypto`), HttpOnly cookie `subenai_edu_author`, JWT claims `{set_id, role:"author"}` signed with `JWT_SECRET`
**Source stories:** `tasks/stories/E12.4-results-dashboard.md`
**Last updated:** 2026-05-01

---

## Context

Reference plan for the planner — demonstrates how to write a plan whose centre of gravity is in **edge cases**. The author password gate is the most security-sensitive endpoint of edu mode (it protects an entire class's PII). The happy path has only one interesting case; the rest of the plan walks attacker scenarios and brittle situations.

## Out of scope

- Aggregate display and the per-respondent table after login — covered by `specs/edu/results-dashboard.md`.
- CSV export logic — covered by `specs/edu/csv-export.md`.
- Deleting a respondent from the dashboard — covered by `specs/edu/delete-respondent.md`.

---

## Happy paths

### TC-01: Correct password opens the dashboard

**AC reference:** AC-1, AC-3

**Prerequisites**:
- An edu test set exists with the password `Tajne123!@#`.
- Browser at `/test/zostava/<setId>/vysledky` (no cookie).

**When** the user types `Tajne123!@#` in the password field
**and** clicks the button labelled "Otvoriť výsledky →"
**Then** the server returns HTTP 200 with `Set-Cookie: subenai_edu_author=<JWT>; HttpOnly; Secure; SameSite=Lax; Path=/test/zostava/<setId>; Max-Age=3600`
**and** the page transitions to the dashboard view (the gate unmounts)
**and** the respondents table is rendered

---

## Negative scenarios

### TC-02: Wrong password fails with a generic 401

**AC reference:** AC-3

**Prerequisites**:
- An edu test set with password `Tajne123!@#`.

**When** the user types `wrong-password`
**and** clicks the submit button
**Then** the server returns HTTP 401 with `{"error":"unauthorized"}`
**and** the response carries no `Set-Cookie` header
**and** the UI shows the Slovak message "Nesprávne heslo, alebo sa zostava nenašla."

### TC-03: Empty password keeps the button disabled

**Prerequisites**:
- The gate is open.

**When** the user clicks submit with the password field empty
**Then** the button is disabled (client-side gate)
**and** no POST is sent

---

## Edge cases

### TC-04: Brute-force — the 6th attempt from the same IP is throttled

**Risk reference:** "Brute force on author password"

**Prerequisites**:
- 5 wrong attempts in the last 15 minutes from `cf-connecting-ip=198.51.100.30` (mocked).

**When** the user submits a 6th attempt with any password (even the correct one)
**Then** the server returns HTTP 429 `{"error":"rate_limited"}` before invoking the RPC
**and** the UI shows "Príliš veľa pokusov. Skús to znova o 15 minút."
**and** even a correct password does not open the dashboard during the penalty window

### TC-05: Distributed brute-force — 10 IPs each at the per-IP cap

**Risk reference:** "IP rotation bypass of brute-force protection"

**Prerequisites**:
- 10 distinct mocked IPs, each having submitted 5 wrong attempts in the last 15 minutes.

**When** an 11th IP submits its first attempt with a wrong password
**Then** the server returns 401 `unauthorized` (not 429 — this IP has its own quota)
**and** the rate limit is **per-(IP, set)**: an attacker with IP rotation can sidestep the cap
**and** _open question (see below): do we need a per-set global cap?_

### TC-06: Password with surrounding whitespace

**Prerequisites**:
- An edu set with password `Tajne123` (no spaces).

**When** the user types `  Tajne123  ` (spaces both sides)
**Then** the server does NOT trim the password before bcrypt comparison
**and** the response is 401 (bcrypt is byte-exact: spaces ≠ no spaces)
**and** _alternatively, if the UI applies `.trim()` to the input, document that explicitly in this plan_

### TC-07: 200-character password

**Prerequisites**:
- An edu set with password `Tajne123` (8 chars; bcrypt-friendly).

**When** the user types a 200-character password
**Then** bcrypt internally truncates input at 72 bytes, but the comparison is correct (`Tajne123` ≠ truncated 200-char input)
**and** the server returns 401
**and** no crash or timeout — bcrypt is fast even on 200 characters

### TC-08: Cookie tampering — payload changed for another set

**Risk reference:** "Session token tampering"

**Prerequisites**:
- The browser holds a valid `subenai_edu_author` cookie for `set-A`.

**When** the user edits the cookie value in DevTools, replacing the base64 payload with claims for `set-B`
**and** opens `/test/zostava/<set-A>/vysledky`
**Then** the server verifies the JWT signature → mismatch (HMAC verify fails)
**and** the response is HTTP 401 with `{"error":"token_bad_signature"}`
**and** the dashboard does not render

### TC-09: Cookie from another set (set_mismatch)

**Prerequisites**:
- A valid session cookie for `set-A`.

**When** the user manually navigates to `/test/zostava/<set-B>/vysledky`
**Then** the browser sends the `set-B` cookie ONLY if Path scope matches (it does NOT — Path is `/test/zostava/set-A`)
**and** the server sees no cookie and returns `no_session` 401
**and** the password gate for `set-B` is shown

### TC-10: Respondent JWT cannot be reused as an author session

**Risk reference:** "Role escalation via reused token"

**Prerequisites**:
- The browser holds a valid respondent attempt JWT (issued by `/api/begin-edu-attempt`) in a custom cookie.

**When** the test sets `subenai_edu_author=<respondent-JWT>` manually
**and** calls `POST /api/results-data`
**Then** `verifyEduAuthorToken` validates the signature, but `claim.role !== "author"`
**and** the server returns HTTP 401 with `{"error":"token_wrong_role"}`
**and** the dashboard does not render

### TC-11: Cookie expired (TTL 60 minutes)

**Prerequisites**:
- A valid author session cookie issued 61 minutes ago (clock shifted forward).

**When** the user calls `POST /api/results-data`
**Then** JWT verification returns `{ok: false, reason: "expired"}`
**and** the server returns HTTP 401 with `{"error":"token_expired"}`
**and** the UI returns to the password gate

### TC-12: Logout DELETE clears the cookie

**Prerequisites**:
- An active session.

**When** the user clicks the button labelled "Odhlásiť"
**Then** the browser sends `DELETE /api/verify-author-password` with `set_id` in the body
**and** the server returns HTTP 200 with `Set-Cookie: subenai_edu_author=; Max-Age=0; Path=/test/zostava/<setId>`
**and** the cookie for that Path is removed in the browser
**and** the next call to `/results-data` returns `no_session`

### TC-13: Logout for a different set

**Prerequisites**:
- A cookie for `set-A` is active.

**When** the user POSTs `DELETE /api/verify-author-password` with `set_id: "set-B"` in the body
**Then** the server issues a Max-Age=0 cookie scoped to Path `/test/zostava/set-B`
**and** the cookie for `set-A` remains intact (Paths are scoped independently)

### TC-14: 50 parallel logins from 50 tabs

**Risk reference:** "Resource exhaustion under burst"

**Prerequisites**:
- 50 tabs open at the same URL with the same correct password.

**When** all 50 tabs submit at once
**Then** the first 5 progress to 401/200 (rate limit allows 5 / 15 min)
**and** the remaining 45 receive HTTP 429 `rate_limited`
**and** no crash, no memory leak server-side

### TC-15: Server failure — Supabase RPC returns 500

**Prerequisites**:
- The mock for `verify_test_set_password` returns 500 (timeout).

**When** the user submits any password
**Then** the server returns HTTP 500 with `{"error":"rpc_failed"}`
**and** the UI shows "Chyba pri overovaní hesla. Skús to prosím znova."
**and** no attempt is added to the rate-limit counter (penalize success/failure, not server error)

### TC-16: JWT_SECRET rotation while a session is active

**Risk reference:** "Secret rotation breaks active sessions"

**Prerequisites**:
- A cookie was issued with the old secret.
- CF Pages env var `JWT_SECRET` was changed to a new secret 1 minute ago.

**When** the user calls `POST /api/results-data`
**Then** verification with the new secret fails → `bad_signature`
**and** the server returns 401 and the UI returns to the gate
**and** _operational note: secret rotation forces every author to log in again — document in the ops runbook_

### TC-17: Show/hide password toggle

**Prerequisites**:
- The password gate is open.

**When** the user types `Tajne123` in the password field
**and** clicks the toggle labelled "Zobraziť"
**Then** the input `type` switches from `password` to `text`
**and** the password becomes plain-text visible
**and** clicking "Skryť" reverts to `password` type
**and** focus stays in the input during the toggle (no flicker)

### TC-18: Keyboard-only flow (a11y)

**Prerequisites**:
- The password gate has focus on the first element.

**When** the user navigates using only the keyboard (Tab to input, Space to toggle show/hide, Enter to submit)
**Then** every interactive element is reachable via Tab
**and** Enter inside the password input submits the form (default form behaviour)
**and** an axe-core scan reports no WCAG AA violations

### TC-19: Browser autofill (password manager)

**Prerequisites**:
- A password manager has a saved entry for subenai.sk.

**When** the user opens the password gate
**Then** the browser auto-fills the field (input has `autocomplete="current-password"`)
**and** submitting with the autofilled value behaves identically to manual entry

### TC-20: Slovak diacritics in the password

**Prerequisites**:
- An edu set with the password `Žofiine-heslo123!`.

**When** the user types exactly `Žofiine-heslo123!` (with `Ž` and `í`)
**Then** UTF-8 encoding survives the WebCrypto / fetch path
**and** bcrypt comparison succeeds server-side
**and** the dashboard opens

### TC-21: Stripe Customer Portal cookie cannot impersonate the author session

**Prerequisites**:
- The browser holds a valid `__Host-stripe-portal-session` cookie from `/spravovat-podporu`.

**When** the user manually renames the cookie to `subenai_edu_author` and visits `/test/zostava/<setId>/vysledky`
**Then** the server attempts to parse it as a JWT → fails (Stripe cookie format ≠ HS256)
**and** returns `token_malformed` 401
**and** no side effect from the Stripe cookie is applied

---

## Open questions

- **Per-set global rate-limit cap** (raised in TC-05) — should we add it to defend against IP-rotation attacks? Cost-benefit before E12 v2.
- **Trim password in the UI?** Currently the code does not trim (TC-06). User-friendliness vs strictness — was the leading/trailing space intentional?
- **Cookie SameSite=Strict** instead of `Lax` after the flow stabilizes — prevents cross-site `<a>` links from opening the dashboard with an existing session, but may break legitimate use cases (e.g. an e-mail link from GMail).

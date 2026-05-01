# Edu intake form validation — negative-focused test plan (EXAMPLE)

**Area:** `specs/examples/`
**Component(s) under test:** `src/components/composer/edu/intake/RespondentIntakeForm.tsx`, `functions/api/begin-edu-attempt.ts`
**Routes:** `/test/zostava/$id` (with `collects_responses=true`)
**API endpoints:** `POST /api/begin-edu-attempt`
**Data dependencies:** `test_sets` (an existing edu set with `collects_responses=true`), `attempts` (RLS "Anon insert non-edu attempts only" blocks anon edu INSERT)
**Source stories:** `tasks/stories/E12.3-respondent-intake.md`, `tasks/stories/E12.7-anti-spam.md`
**Last updated:** 2026-05-01

---

## Context

Reference plan for the planner — focused on negative scenarios. The edu intake form (E12.3 + E12.7) must withstand routine user mistakes, bot abuse, and server failures. The plan deliberately keeps Happy paths thin (covered in `specs/edu/intake-form.md`) and concentrates value in **negative + edge cases**.

## Out of scope

- Author flow that creates an edu test set — covered by `specs/composer/edu-toggle.md`.
- Author results dashboard — covered by `specs/edu/results-dashboard.md`.
- JWT verification in `/api/finish-edu-attempt` — covered by `specs/edu/finish-attempt.md`.

---

## Happy paths

### TC-01: Valid intake issues a JWT and starts the test

**AC reference:** AC-3, AC-4

**Prerequisites**:
- An edu test set exists with `collects_responses=true`.
- Browser at `/test/zostava/<setId>`.
- No row exists in `attempts` for `(set_id, jana@skola.sk)`.

**When** the user fills the "Meno a priezvisko" field with `Jana Nováková`
**and** fills the "E-mail" field with `jana@skola.sk`
**and** ticks the GDPR consent checkbox
**and** clicks the button labelled "Pokračovať na test →"
**Then** `POST /api/begin-edu-attempt` returns HTTP 200 with a valid JWT in the body
**and** the intake form unmounts and the first question of the test is rendered

---

## Negative scenarios

### TC-02: Submit without a name keeps the button disabled

**AC reference:** AC-2 (client-side validation)

**Prerequisites**:
- The intake form on `/test/zostava/<setId>` is open.

**When** the user fills the e-mail with `jana@skola.sk`
**and** ticks the GDPR consent checkbox
**and** clicks the submit button while the "Meno a priezvisko" field is empty
**Then** the button stays disabled (client-side gate)
**and** no POST to `/api/begin-edu-attempt` is sent

### TC-03: Server rejects an invalid e-mail format

**AC reference:** AC-2 (server-side validation)

**Prerequisites**:
- Client-side validation bypassed via `evaluate` (direct `fetch` to the endpoint).

**When** the user POSTs `/api/begin-edu-attempt` with `email: "not-an-email"`
**Then** the server returns HTTP 400 with body `{"error":"invalid_email"}`
**and** no row is added to `attempts`

### TC-04: Name shorter than 2 characters is rejected

**AC reference:** AC-2

**Prerequisites**:
- The intake form is open.

**When** the user fills the "Meno a priezvisko" field with `X` (1 character)
**and** fills the e-mail and consent correctly
**and** submits via `evaluate` (bypassing client-side validation)
**Then** the server returns HTTP 400 with `{"error":"name_length"}`
**and** the UI shows the Slovak message "Meno musí mať aspoň 2 a najviac 80 znakov."

### TC-05: Name longer than 80 characters is rejected

**AC reference:** AC-2

**Prerequisites**:
- The intake form is open.

**When** the user attempts to enter a name of 81 characters (`'x'.repeat(81)`)
**Then** the input has `maxLength=80` (HTML limits to 80)
**and** when bypassed via `evaluate`, the server returns `name_length` 400

### TC-06: Submit without GDPR consent

**AC reference:** AC-2

**Prerequisites**:
- Name and e-mail are filled, but the GDPR checkbox is unticked.

**When** the user clicks the submit button
**Then** the button stays disabled (consent is required client-side)
**and** when bypassed and `consent: false` is POSTed, the server returns `invalid_shape` 400

### TC-07: Test set does not exist

**AC reference:** AC-3 (server lookup)

**Prerequisites**:
- A random UUID `00000000-0000-0000-0000-000000000000` that does not match any row in `test_sets`.

**When** the user POSTs with this `set_id` and otherwise valid data
**Then** the server returns HTTP 404 with `{"error":"set_not_found"}`
**and** the UI shows the Slovak message "Tento test už neexistuje. Pýtaj sa autora na nový odkaz."

### TC-08: Test set exists but `collects_responses=false`

**AC reference:** AC-3

**Prerequisites**:
- An existing NON-edu `test_sets` row in the DB.

**When** the user POSTs with this set_id
**Then** the server returns HTTP 400 with `{"error":"not_edu_set"}`
**and** the UI shows "Tento test nezbiera odpovede s menom — preto sem prístup nepotrebuješ."

### TC-09: Duplicate respondent — same e-mail for the same set

**AC reference:** AC-3 (dedupe)

**Prerequisites**:
- A row in `attempts` exists with `(set_id=X, respondent_email='jana@skola.sk')`.

**When** the user POSTs with the same `set_id` and `email: "jana@skola.sk"` (lower-case match)
**Then** the server returns HTTP 409 with `{"error":"already_attempted"}`
**and** the UI shows "Tento test si už pod týmto e-mailom absolvoval/a. Pre opakovanie kontaktuj autora."

---

## Edge cases

### TC-10: Honeypot field non-empty triggers bot detection

**AC reference:** AC-2 (E12.7)
**Risk reference:** "Bot fills real email of someone else"

**Prerequisites**:
- The intake form is open.

**When** the test sets the hidden `input[name="hp_url"]` to `http://spam.example/` via `evaluate`
**and** submits the form with otherwise valid data
**Then** the server returns HTTP 400 with `{"error":"spam_detected"}`
**and** the server console contains a `console.warn("begin-edu-attempt honeypot tripped", ...)` log
**and** no JWT is issued

### TC-11: Per-IP rate limit blocks the 4th attempt within 5 minutes

**Risk reference:** "Bot abuses the public link"

**Prerequisites**:
- The same mocked `cf-connecting-ip` has issued 3 POSTs with different e-mails.

**When** the user POSTs a 4th request with another valid e-mail
**Then** the server returns HTTP 429 with `{"error":"rate_limited"}`
**and** the UI shows "Príliš veľa pokusov v krátkom čase. Skús znova o pár minút."

### TC-12: E-mail with mixed case is deduplicated case-insensitively

**Risk reference:** "Same respondent registers twice via case variation"

**Prerequisites**:
- A row in `attempts` exists with `respondent_email='jana@skola.sk'` (lower-case).

**When** the user POSTs with `email: "JANA@SKOLA.SK"` (different case, same address)
**Then** the server normalizes to lower-case before the dup check
**and** returns HTTP 409 `already_attempted` (not 200 — INSERT would otherwise create two rows)

### TC-13: E-mail with leading/trailing whitespace is trimmed

**Prerequisites**:
- The intake form is open.

**When** the user fills the e-mail field with `"  jana@skola.sk  "` (with surrounding spaces)
**and** submits the form
**Then** the server `.trim()`s the whitespace before validation
**and** returns 200 OK (or `already_attempted` if duplicate), not `invalid_email`

### TC-14: Slovak diacritics in the name round-trip cleanly

**Risk reference:** "Encoding issues with non-ASCII names"

**Prerequisites**:
- The intake form is open.

**When** the user fills the "Meno a priezvisko" field with `Žofia Ščúrová-Ďurišová`
**and** submits the form
**Then** the issued JWT's `name` claim contains the full UTF-8 string including diacritics
**and** after `/api/finish-edu-attempt`, `attempts.respondent_name` matches the input exactly

### TC-15: XSS attempt in the name field is neutralized downstream

**Risk reference:** "XSS via respondent name"

**Prerequisites**:
- The intake form is open.

**When** the user fills the "Meno a priezvisko" field with `<script>alert('xss')</script>`
**and** completes the entire flow including the test
**and** the author opens the results dashboard
**Then** the string renders as plain text in the dashboard (React auto-escape)
**and** no `alert` dialog fires
**and** the value is wrapped in `"…"` in the CSV export per RFC 4180

### TC-16: Network goes offline during submission

**Prerequisites**:
- A valid form is filled.
- Playwright `context.setOffline(true)` is enabled before the submit click.

**When** the user clicks the button labelled "Pokračovať na test →"
**Then** after roughly 5 seconds the UI shows "Pripojenie sa nepodarilo. Skontroluj sieť a skús znova."
**and** the submit button becomes enabled again for retry
**and** after `setOffline(false)` and a re-click, the flow succeeds

### TC-17: Double-click during in-flight submission

**Prerequisites**:
- The server response is delayed by 2 seconds via a `route` mock.

**When** the user clicks the submit button
**and** clicks it again within 100 ms
**Then** the second click is ignored (state `submitting` blocks repeat calls)
**and** exactly one POST request is sent

### TC-18: Browser back after a successful intake

**Prerequisites**:
- Intake succeeded; the test is in progress (question 3 of 15).

**When** the user presses the browser back button
**Then** the user lands on the intake form OR sees a confirmation dialog before leaving
**and** if the user navigates forward again, the in-memory JWT is still valid (token not lost)

### TC-19: Keyboard-only flow (a11y)

**Risk reference:** "WCAG AA failure on intake form"

**Prerequisites**:
- The intake form is open with focus on the first input.

**When** the user navigates the form using only the keyboard (Tab through all fields, Space on the checkbox, Enter to submit)
**Then** every input is reachable via Tab in logical order
**and** the GDPR consent label activates the checkbox via Space (no need to click)
**and** an axe-core scan reports no WCAG AA violations

---

## Open questions

- What message does the UI show for `set_not_found` if the set existed but was auto-deleted by the 12-month retention cron `purge_unused_test_sets`? — _currently identical to manually-missing; possibly worth nuancing._

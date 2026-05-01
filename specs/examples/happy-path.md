# Anonymous quiz — happy-path test plan (EXAMPLE)

**Area:** `specs/examples/`
**Component(s) under test:** `src/routes/test.index.tsx`, `src/components/quiz/flow/TestFlow.tsx`, `src/components/quiz/results/ResultsView.tsx`
**Routes:** `/test`, `/r/$shareId`
**API endpoints:** _None — direct anon Supabase INSERT via `@/integrations/supabase/client`._
**Data dependencies:** `attempts` table (RLS policy "Anon insert non-edu attempts only" allows INSERT when `respondent_name IS NULL`)
**Source stories:** _None — pre-story feature; the example exists to teach the planner the shape, not to map a real epic._
**Last updated:** 2026-05-01

---

## Context

Reference plan for the planner agent. Covers the simplest flow: an anonymous user lands on `/test`, clicks "Spustiť test", answers 15 questions, sees the results screen, and follows the share link. No name, no e-mail, no password. Use this file as the canonical shape for tone, granularity, and how Slovak UI strings get quoted inside an otherwise English plan.

## Out of scope

- Scoring algorithm (covered by unit tests in `tests/lib/quiz/`).
- Trap dialog (separate plan in `specs/quiz/trap-dialog.md`).
- Survey card after the test (separate plan in `specs/quiz/post-test-survey.md`).

---

## Happy paths

### TC-01: Start the quiz, answer all questions, and reach the result screen

**Prerequisites**:
- Browser at `http://localhost:8080/`.
- No consent record yet (clean localStorage).
- Vite + Wrangler running (`npm run dev` + `npm run dev:api`).
- Viewport 1280×800.

**When** the user clicks the primary CTA labelled "Spustiť test" in the hero section
**and** accepts necessary cookies via the banner button labelled "Prijať všetko"
**and** answers all 15 questions by clicking the option that looks legitimate
**Then** the page transitions to the result screen with a heading containing the word "skóre"
**and** a percentile in the range 0–100 is shown
**and** a personality archetype is displayed (one of the five Slovak labels defined in `src/lib/quiz/score/scoring.ts`)
**and** exactly one new row is inserted into `attempts` with `respondent_name IS NULL`

### TC-02: Share link round-trips back to the same result

**Prerequisites**:
- TC-01 has run — a `share_id` is visible on the result screen.

**When** the user clicks the button labelled "Skopírovať odkaz"
**and** the copied URL is opened in an incognito window
**Then** `/r/$shareId` shows the same score as the original session
**and** the answer review section appears after the user clicks the toggle labelled "Pozrieť detailný rozbor"

---

## Negative scenarios

### TC-03: Closing the tab mid-quiz preserves progress on return

**Prerequisites**:
- The quiz is in progress with 5 of 15 questions answered.

**When** the user closes the tab
**and** reopens `/test`
**Then** the page offers to resume from question 6 via sessionStorage state
**and** the progress bar shows 5/15 completed

### TC-04: Submission fails when Supabase returns 500

**Prerequisites**:
- A Playwright `route` mock on `*/rest/v1/attempts` that returns 500.

**When** the user finishes all 15 questions
**Then** the result screen still shows the score (computed client-side)
**and** a neutral error message is shown: "Výsledok sa nepodarilo uložiť, ale tvoje skóre vidíš tu"
**and** no `share_id` is generated
**and** no PII appears in the browser console error log

---

## Edge cases

### TC-05: Quiz finished in under one second triggers anti-cheat

**Prerequisites**:
- Headless mode with scripted clicks issued as fast as possible.

**When** the user clicks all 15 answers within one second of starting the quiz
**Then** the result screen shows a score of 0 or surfaces a "cheat detected" flag
**and** the value `"too_fast"` is appended to `attempts.flags`

### TC-06: Quiz that takes more than one hour is rejected

**Prerequisites**:
- Browser clock shifted backwards by 60 minutes via the `clock` API.

**When** the user submits the final answer 60+ minutes after starting
**Then** the server rejects the INSERT via the `attempts_time_nonneg` constraint (max 3 600 000 ms)
**and** the client shows the message "Test trval príliš dlho, skús odznova"

### TC-07: Slovak diacritics in the post-test nickname survive a save

**Prerequisites**:
- The survey card is visible after quiz completion.

**When** the user fills the "Prezývka" field with the value `Žofia Ščúrová-Ďurišová`
**and** clicks the button labelled "Uložiť"
**Then** the UPDATE on `attempts` succeeds (demographics-only RLS policy)
**and** the diacritics render correctly when `/r/$shareId` is reloaded

### TC-08: Refresh during the final submit does not double-insert

**Prerequisites**:
- The user is on the last (15th) question.

**When** the user clicks the final answer
**and** immediately presses F5 before the server response arrives
**Then** exactly one new row is inserted into `attempts`, not two
**and** the result screen after the reload shows the same score

### TC-09: localStorage disabled (privacy mode)

**Prerequisites**:
- Browser context with `storageState: { localStorage: [] }` and Playwright permissions blocking storage.

**When** the user clicks the CTA labelled "Spustiť test"
**Then** the quiz starts (state held in memory, not persisted)
**and** after a refresh the progress is lost and the UI shows "Pokračovať od začiatku"
**and** no console error escapes (graceful degradation)

### TC-10: Mobile viewport keeps every CTA inside the viewport

**Prerequisites**:
- Viewport 375×667 (iPhone SE).

**When** the user walks through the entire quiz in mobile mode
**Then** the button labelled "Pokračovať" stays inside the viewport on every question
**and** no element forces `document.body.width > 375`

---

## Open questions

- Is there a concrete rate limit on anon `attempts` INSERT today? (Currently only the CF Pages-level limit applies.) — _open; affects whether to add a TC for abuse rate-limit boundary._

# Site footer — test plan

**Area:** `specs/cross-cutting/`
**Component(s) under test:** `src/components/layout/Footer.tsx`
**Routes:** every route that imports `<Footer>` (home, /skolenia, /podpora, /testy, /kontakt, /o-projekte, /sponzori, /privacy, /cookies, /zmeny, /spravovat-podporu) — NOT rendered on the 404 page (`__root.tsx` `NotFoundComponent`)
**API endpoints:** Supabase REST `GET /rest/v1/footer_sponsors` (sponsor strip data, anon read)
**Data dependencies:** `footer_sponsors` view (tier-gated: cumulative donations ≥ 50 EUR OR active monthly subscription ≥ 25 EUR — see `supabase/migrations/20260427000000_sponsors.sql`)
**Source stories:** _None — pre-story shared layout shipped before the story-driven workflow; intent inferred from `src/components/layout/Footer.tsx` + `git log` on the file._
**Last updated:** 2026-05-02

---

## Context

The footer is a shared layout component rendered at the bottom of every primary route (the 404 page is a deliberate exception — `NotFoundComponent` in `__root.tsx` doesn't include `<Footer>`). It carries: a brand block (logo link, Slovak tagline, version link to `/zmeny`, external "Novejši" credit), three navigation columns (`"Obsah"`, `"Projekt"`, `"Právne"`) totalling 12 internal links, a conditionally-rendered sponsor strip (only when the `footer_sponsors` view returns ≥ 1 row), a bottom bar with a dynamic copyright paragraph and the `"Nastavenia cookies"` button (opens consent preferences via `useConsent().openPreferences()`), and a "powered by lvtesting.eu" attribution. A module-level promise cache (`cachedSponsorsPromise`) shares the Supabase fetch across multiple `<Footer>` mounts in the same SPA session.

## Out of scope

- The full Stripe sponsorship checkout / customer-portal flow — covered by `specs/sponsorship/`.
- The `/sponzori` index page itself — only the footer's "všetci sponzori →" link target is asserted here.
- The `/zmeny` changelog page rendering — only the footer's version link target is asserted here.
- The consent preferences dialog body — only the click-to-open path from the footer button is asserted here. The dialog's own contract is in `specs/consent/`.

---

## Happy paths

### TC-01: Brand block renders the logo link, tagline and version link

**Prerequisites**:
- Browser at `http://localhost:8080/`, viewport 1280×800.
- Cookie consent already granted (`primeConsent` "all").

**When** the page is loaded
**Then** a link inside the footer with the accessible name `"subenai — domov"` exists with `href="/"` and wraps an `<img alt="subenai">`
**and** a paragraph containing `"Bezplatný edukatívny nástroj pre slovenský digitálny svet."` is visible inside the footer
**and** a link with the accessible name matching `/^Aktuálna verzia v[0-9]+\.[0-9]+\.[0-9]+ — zoznam zmien$/` is present with `href="/zmeny"` and visible text `v<semver>`

### TC-02: Clicking the version link routes to /zmeny

**Prerequisites**:
- Browser at `http://localhost:8080/`, viewport 1280×800.

**When** the user clicks the footer's version link (accessible name starts with `"Aktuálna verzia"`)
**Then** the URL changes to `/zmeny`
**and** the footer remains rendered on the destination page

### TC-03: All three navigation columns render the correct headings and link targets

**Prerequisites**:
- Browser at `http://localhost:8080/`, viewport 1280×800.

**When** the user inspects the footer's three columns
**Then** an `<h3>` with text `"Obsah"` is visible followed by links `"Spustiť test" → /test`, `"Sada testov" → /testy`, `"Školenia" → /skolenia`, `"Pre školy" → /skoly`
**and** an `<h3>` with text `"Projekt"` is visible followed by links `"O projekte" → /o-projekte`, `"Kontakt" → /kontakt`, `"Podporiť projekt" → /podpora`, `"Sponzori" → /sponzori`, `"Zmeny a verzie" → /zmeny`
**and** an `<h3>` with text `"Právne"` is visible followed by links `"Súkromie" → /privacy`, `"Cookies" → /cookies`, `"Spravovať podporu (sponzori)" → /spravovat-podporu`

### TC-04: Bottom bar shows the copyright paragraph and the cookies-settings button

**Prerequisites**:
- Browser at `http://localhost:8080/`, viewport 1280×800.

**When** the page is loaded
**Then** a paragraph inside the footer reads `"© <YYYY> subenai · Všetky práva vyhradené."` where `<YYYY>` is the current calendar year
**and** a `<button type="button">` with text `"Nastavenia cookies"` is present
**and** clicking that button opens the consent preferences dialog (the `useConsent.openPreferences` callback fires)

### TC-05: External attribution links carry target="_blank" + rel="noopener noreferrer"

**Prerequisites**:
- Browser at `http://localhost:8080/`, viewport 1280×800.

**When** the user inspects the external links inside the footer
**Then** the `"Novejši"` link has `href="https://www.youtube.com/watch?v=dbuCSt_k5c8"`, `target="_blank"`, `rel="noopener noreferrer"`
**and** the `"lvtesting.eu"` link has `href="https://www.lvtesting.eu"`, `target="_blank"`, `rel="noopener noreferrer"`

### TC-06: Footer renders identically on a nested route (/skolenia)

**Prerequisites**:
- Browser at `http://localhost:8080/skolenia`, viewport 1280×800.

**When** the page is loaded
**Then** the brand block, all three nav columns, the bottom bar and the cookies-settings button are rendered
**and** every link target matches what TC-01 / TC-03 asserted on the home page (the footer is a shared layout, not route-specific)

### TC-07: Internal footer links navigate via TanStack Router (no full page reload)

**Prerequisites**:
- Browser at `http://localhost:8080/`, viewport 1280×800.

**When** the user clicks the footer's `"Sada testov"` link in the `"Obsah"` column
**Then** the URL changes to `/testy` without firing a full-page `load` event (TanStack Router client-side navigation)
**and** the footer on `/testy` renders with its links intact
**and** pressing the browser back button returns to `/` without a reload

### TC-08: Sponsor strip is hidden when footer_sponsors returns an empty list

**Prerequisites**:
- Browser at `http://localhost:8080/`, viewport 1280×800.
- The Supabase `footer_sponsors` view returns `[]` (default dev seed state — no donations / subscriptions exist that meet the tier rule).

**When** the page is loaded
**Then** the heading `"Vďaka top sponzorom"` is NOT present in the DOM
**and** the sponsor `<ul>` is NOT rendered
**and** the rest of the footer (brand block, columns, bottom bar) is unaffected

### TC-09: Sponsor strip renders names + links when footer_sponsors returns rows

**Prerequisites**:
- Browser at `http://localhost:8080/`, viewport 1280×800.
- A Playwright `route` mock on `**/rest/v1/footer_sponsors*` returns two rows: `{id:"a", display_name:"Acme Corp", display_link:"https://acme.example"}` and `{id:"b", display_name:"Plain Donor", display_link:null}`.

**When** the page is loaded
**Then** the heading `"Vďaka top sponzorom"` is visible
**and** a list item for `"Acme Corp"` renders as `<a href="https://acme.example" target="_blank" rel="noopener noreferrer">` with a trailing `<span aria-hidden="true">↗</span>`
**and** a list item for `"Plain Donor"` renders as plain text (a `<span>`, not an `<a>`) — no `href`, `target`, or `rel` attributes
**and** a link `"všetci sponzori →"` pointing to `/sponzori` follows the sponsor list

---

## Negative scenarios

### TC-10: Footer is intentionally absent from the 404 page

**Prerequisites**:
- Browser at `http://localhost:8080/this-route-does-not-exist`, viewport 1280×800.

**When** the page is loaded
**Then** the 404 view renders with the headings `"404"` and `"Stránka nenájdená"`
**and** no `<footer>` element appears in the DOM (`NotFoundComponent` in `__root.tsx` does not include `<Footer>` — this is intentional, captured here so a future regression that adds the footer back surfaces as a test failure)

### TC-11: Supabase 500 on the sponsor fetch degrades gracefully

**Prerequisites**:
- Browser at `http://localhost:8080/`, viewport 1280×800.
- A Playwright `route` mock on `**/rest/v1/footer_sponsors*` returns HTTP 500.

**When** the page is loaded
**Then** the sponsor strip is not rendered (the `loadFooterSponsors` error path returns `[]`)
**and** the rest of the footer (brand block, nav columns, bottom bar) renders without error
**and** no unhandled promise rejection appears in the browser console
**and** the module-level `cachedSponsorsPromise` is reset to `null` on error so a subsequent mount retries

### TC-12: Network abort (ad-blocker pattern) on the sponsor fetch degrades gracefully

**Prerequisites**:
- Browser at `http://localhost:8080/`, viewport 1280×800.
- A Playwright `route` aborts every request matching `**/rest/v1/footer_sponsors*` (simulates an ad-blocker pattern targeting the Supabase host).

**When** the page is loaded
**Then** the sponsor strip is not rendered
**and** the rest of the footer renders without error
**and** no unhandled rejection appears in the console

---

## Edge cases

### TC-13: Mobile viewport (375×667) — single-column stack, no horizontal overflow

**Prerequisites**:
- Browser at `http://localhost:8080/`, viewport 375×667.

**When** the page is loaded
**Then** the four-block grid (brand + three nav columns) stacks vertically into a single column (`<sm` breakpoint, no `sm:grid-cols-2` yet)
**and** text alignment inside the footer is `text-center` (no `sm:text-left`)
**and** the bottom bar stacks vertically (copyright paragraph above the `"Nastavenia cookies"` button)
**and** `document.documentElement.scrollWidth ≤ 375` — the footer introduces no horizontal scroll

### TC-14: Tablet viewport (768×1024) — two-column grid kicks in

**Prerequisites**:
- Browser at `http://localhost:8080/`, viewport 768×1024.

**When** the page is loaded
**Then** the four-block grid is `grid-cols-2` (Tailwind `sm:grid-cols-2` activates at ≥ 640 px) and `md:grid-cols-4` activates at ≥ 768 px so the layout becomes a four-column row
**and** `document.documentElement.scrollWidth ≤ 768` — no horizontal scroll
**and** text alignment inside the footer is `text-left` (the `sm:text-left` override applies)

### TC-15: Desktop viewport (1280×800) — four-column row centered within max-w-5xl

**Prerequisites**:
- Browser at `http://localhost:8080/`, viewport 1280×800.

**When** the page is loaded
**Then** the four blocks render side-by-side in a single row (`md:grid-cols-4`)
**and** the `<footer>` element's bounding box fits inside `max-w-5xl` (≤ 1024 px) horizontally and is centered with `mx-auto`
**and** `document.documentElement.scrollWidth ≤ 1280`

### TC-16: Keyboard tab order through the footer's interactive elements

**Prerequisites**:
- Browser at `http://localhost:8080/`, viewport 1280×800.
- Focus has been moved to the first focusable element inside the footer (e.g. by tabbing past every preceding interactive element on the home page, or by programmatically focusing the footer logo).

**When** the user presses `Tab` repeatedly inside the footer
**Then** focus moves in document order: footer logo → `"Novejši"` external link → version link → `"Spustiť test"` → `"Sada testov"` → `"Školenia"` → `"Pre školy"` → `"O projekte"` → `"Kontakt"` → `"Podporiť projekt"` → `"Sponzori"` → `"Zmeny a verzie"` → `"Súkromie"` → `"Cookies"` → `"Spravovať podporu (sponzori)"` → `"Nastavenia cookies"` button → `"lvtesting.eu"`
**and** every interactive element receives focus (none are skipped or `tabIndex="-1"`)
**and** pressing `Enter` while the `"Nastavenia cookies"` button is focused opens the consent preferences dialog

### TC-17: Footer logo carries `aria-label="subenai — domov"` AND non-empty `<img alt>`

**Prerequisites**:
- Browser at `http://localhost:8080/`, viewport 1280×800.

**When** the user inspects the footer's brand-block logo link
**Then** the `<a>` element has `aria-label="subenai — domov"` and `href="/"`
**and** the inner `<img>` has `alt="subenai"` (non-empty — it conveys the brand name, the link is not decorative)

### TC-18: `<footer>` is nested inside `<main>` and therefore lacks the `contentinfo` landmark — known a11y gap

**Prerequisites**:
- Browser at `http://localhost:8080/`, viewport 1280×800.

**When** the user queries the DOM for the footer's ARIA role
**Then** the `<footer>` element is a descendant of `<main>` (not a direct `<body>` child)
**and** because of the HTML spec rule, the `<footer>` does NOT receive the implicit `contentinfo` landmark role
**and** `document.querySelectorAll('[role="contentinfo"]').length === 0` — the page exposes no `contentinfo` landmark
**and** _open question (see below): should the footer move out of `<main>` in `__root.tsx`, or carry an explicit `role="contentinfo"`? Either fix flips this test from green-codified-gap to red, signalling the regression to fix._

### TC-19: Sponsor fetch is shared across two footer mounts (module-level promise cache)

**Prerequisites**:
- Browser at `http://localhost:8080/`, viewport 1280×800.
- Playwright `request.recorder` (or `page.on("request", …)`) is recording every URL matching `**/rest/v1/footer_sponsors*`.

**When** the user navigates `/` → `/skolenia` (both pages mount the footer; SPA soft navigation, no full reload)
**Then** exactly ONE `GET /rest/v1/footer_sponsors` request fires across both navigations (the `cachedSponsorsPromise` is reused on the second mount)
**and** _note: a hard reload (`Ctrl+R`) discards the module cache and triggers a fresh fetch — that's a separate scenario, not asserted here._

### TC-20: Copyright year is dynamic (year boundary)

**Prerequisites**:
- Browser at `http://localhost:8080/`, viewport 1280×800.
- Playwright `page.clock.setSystemTime(new Date("2027-01-01T00:00:01Z"))` shifts the page clock to the next year.

**When** the page is reloaded so the footer evaluates `new Date().getFullYear()` against the shifted clock
**Then** the copyright paragraph reads `"© 2027 subenai · Všetky práva vyhradené."`
**and** no hardcoded `2026` literal appears in the visible footer text

---

## Open questions

- **`contentinfo` landmark gap** (TC-18). The footer being inside `<main>` is an oversight — fix path is either lifting `<Footer>` to `__root.tsx` outside `<main>`, or adding `role="contentinfo"` to the `<footer>` JSX. Needs product sign-off because the layout move may affect spacing.
- **Footer absent from 404** (TC-10). Intentional today (`NotFoundComponent` is a centered "go home" view) but undocumented. Confirm whether the design decision should be captured in `tasks/PLAN-*.md` so future authors don't "fix" it back.
- **Sponsor strip plan separation.** The full tier-gate logic (≥ 50 EUR cumulative or ≥ 25 EUR/mo active) lives in the `footer_sponsors` SQL view. This plan covers only the rendering contract (TC-08, TC-09); the tier-rule contract may deserve its own plan in `specs/sponsorship/footer-sponsors.md` once E10/E11 stabilizes.
- **Hard-reload promise cache** (TC-19). Not asserted because Playwright contexts already start with a fresh module cache per test. If we ever ship a service worker that persists state across reloads, revisit this.

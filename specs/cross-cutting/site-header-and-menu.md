# Site header and responsive navigation menu — test plan

**Area:** `specs/cross-cutting/`
**Component(s) under test:** `src/components/layout/SiteHeader.tsx`
**Routes:** every route — the header is rendered inside `src/routes/__root.tsx` and is therefore visible on `/`, `/test`, `/testy`, `/skolenia`, `/podpora`, `/kontakt`, `/test/zostav`, `/skoly`, `/r/$shareId`, `/test/zostava/$id`, etc.
**API endpoints:** _None — the header is purely a client-side component._
**Data dependencies:** `useLocation()` from TanStack Router (active-link state).
**Source stories:** _None — pre-story feature; intent inferred from `src/components/layout/SiteHeader.tsx` and the `NAV_ITEMS` constant._
**Last updated:** 2026-05-02

---

## Context

`SiteHeader` is a sticky full-width header rendered inside `__root.tsx`, so it appears on every route. It has two responsive layouts: a desktop variant (md+, ≥768 px) with inline nav links and a CTA pill, and a mobile variant (<768 px) with a hamburger trigger that opens a Radix `Sheet` from the right. Active-link highlighting uses most-specific-match-wins logic so nested routes such as `/testy/eshop` highlight only the deepest registered nav entry. The mobile `Sheet` auto-closes when the router pathname changes (`useEffect` on `pathname`).

Slovak strings the plan asserts against (verbatim from the component):

- nav labels: `"Testy"`, `"Školenia"`, `"Podporiť projekt"`, `"Kontakt"`
- CTA short label: `"Spustiť test"`, long label / aria-label: `"Spustiť rýchly test"`
- aria-label on the nav element: `"Hlavná navigácia"`
- aria-label on the logo link: `"subenai — domov"`
- mobile open trigger aria-label: `"Otvoriť menu"`, close button aria-label: `"Zavrieť menu"`

## Out of scope

- Footer behaviour — covered by `specs/cross-cutting/footer.md` (separate plan).
- Cookie consent banner — covered by `specs/consent/banner.md`.
- The actual destinations the nav links point to — landing pages have their own area plans (`specs/test-packs/`, `specs/courses/`, `specs/sponsorship/`, etc.). This plan only checks that navigation lands on the correct URL.
- Auth-driven header variants — there are none today (no logged-in state).

---

## Happy paths

### TC-01: All four desktop nav links are visible and route to their targets

**Prerequisites**:
- Browser at `http://localhost:8080/` with viewport 1280×800.

**When** the user inspects the header
**Then** the `nav` element with aria-label `"Hlavná navigácia"` is present
**and** four links are visible with the labels `"Testy"`, `"Školenia"`, `"Podporiť projekt"`, `"Kontakt"`
**and** clicking `"Testy"` navigates to `/testy`
**and** clicking `"Školenia"` navigates to `/skolenia`
**and** clicking `"Podporiť projekt"` navigates to `/podpora`
**and** clicking `"Kontakt"` navigates to `/kontakt`

### TC-02: The logo links to the home page from any route

**Prerequisites**:
- Browser at `http://localhost:8080/testy` with viewport 1280×800.

**When** the user clicks the logo link with aria-label `"subenai — domov"`
**Then** the URL changes to `/`
**and** the home page renders

### TC-03: The CTA pill navigates to `/test` and adapts its label to the viewport

**Prerequisites**:
- Browser at `http://localhost:8080/`.

**When** the viewport is 1280×800 (lg+)
**Then** the CTA pill has aria-label `"Spustiť rýchly test"`
**and** its visible text contains the word `"rýchly"` (the `span.hidden.lg:inline` is shown)
**and** when the viewport is resized to 900×700 (md, below the lg breakpoint of 1024 px) the visible label collapses to `"Spustiť test →"` while the aria-label remains `"Spustiť rýchly test"`
**and** clicking the CTA navigates to `/test`

### TC-04: The mobile hamburger opens a `Sheet` containing every nav item plus the CTA

**Prerequisites**:
- Browser at `http://localhost:8080/` with viewport 375×667.

**When** the user clicks the trigger with aria-label `"Otvoriť menu"`
**Then** the desktop nav (`div.md:flex`) is hidden
**and** the Radix `Sheet` opens from the right
**and** it contains the close button with aria-label `"Zavrieť menu"`, the logo link with aria-label `"subenai — domov"`, the four nav links (`"Testy"`, `"Školenia"`, `"Podporiť projekt"`, `"Kontakt"`) as a vertical list, and a full-width CTA link with aria-label `"Spustiť rýchly test"` showing the text `"Spustiť test"`
**and** clicking the close button collapses the `Sheet` and the trigger becomes available again

### TC-05: Clicking a nav link inside the `Sheet` navigates and auto-closes the menu

**Prerequisites**:
- Mobile viewport 375×667 with the `Sheet` open from TC-04.

**When** the user clicks the link `"Testy"` inside the `Sheet`
**Then** the URL changes to `/testy`
**and** the `Sheet` closes automatically (driven by `useEffect` on pathname)
**and** the hamburger trigger is visible again on the new route

### TC-06: Active route is highlighted in the desktop nav

**Prerequisites**:
- Browser at `http://localhost:8080/skolenia` with viewport 1280×800.

**When** the user inspects the header
**Then** the desktop link `"Školenia"` carries the active class (`text-foreground`, not `text-muted-foreground`)
**and** the other three nav links carry the inactive class
**and** navigating to `/podpora` shifts the active state to the `"Podporiť projekt"` link

### TC-07: A nested route (`/testy/eshop`) highlights only the most-specific matching nav entry

**Prerequisites**:
- Browser at `http://localhost:8080/testy/eshop` with viewport 1280×800.

**When** the user inspects the header
**Then** the link `"Testy"` is the only one in the active state
**and** no other link is highlighted (the most-specific-match-wins logic prevents `/skolenia` or any unrelated link from picking up the active state)

### TC-08: Active route is highlighted inside the mobile `Sheet`

**Prerequisites**:
- Browser at `http://localhost:8080/skolenia` with viewport 375×667.

**When** the user opens the `Sheet` via the trigger labelled `"Otvoriť menu"`
**Then** the `"Školenia"` row inside the `Sheet` carries the active background class (`bg-primary/10`)
**and** the other three rows carry the inactive class

---

## Negative scenarios

### TC-09: The hamburger trigger is not visible on a desktop viewport

**Prerequisites**:
- Browser at `http://localhost:8080/` with viewport 1280×800.

**When** the user inspects the header
**Then** the trigger with aria-label `"Otvoriť menu"` is hidden (display: none from the `md:hidden` Tailwind class)
**and** the desktop nav (`div.md:flex`) is visible

### TC-10: The desktop nav is not visible on a mobile viewport

**Prerequisites**:
- Browser at `http://localhost:8080/` with viewport 375×667.

**When** the user inspects the header
**Then** the desktop nav container (`div.hidden.md:flex`) is hidden
**and** the hamburger trigger with aria-label `"Otvoriť menu"` is visible

### TC-11: The header still renders on an unknown (404) route

**Prerequisites**:
- Browser at `http://localhost:8080/this-route-does-not-exist` with viewport 1280×800.

**When** the user inspects the page
**Then** the header is rendered
**and** all four nav links + the CTA pill are present
**and** none of the nav links is in the active state (no path match)

### TC-12: Repeatedly opening and closing the mobile `Sheet` does not leak state

**Prerequisites**:
- Browser at `http://localhost:8080/` with viewport 375×667.

**When** the user opens the `Sheet` via the `"Otvoriť menu"` trigger and closes it via `"Zavrieť menu"` ten times in a row
**Then** the `Sheet` opens and closes correctly on every iteration
**and** no `console.error` appears
**and** the hamburger trigger remains operable after the last cycle

### TC-13: The route `/test` does not appear as an active nav item (CTA is excluded from `NAV_ITEMS`)

**Prerequisites**:
- Browser at `http://localhost:8080/test` with viewport 1280×800.

**When** the user inspects the header
**Then** none of the four nav links (`"Testy"`, `"Školenia"`, `"Podporiť projekt"`, `"Kontakt"`) is in the active state
**and** the CTA pill is rendered without an active highlight (the CTA is intentionally not part of `NAV_ITEMS`)

---

## Edge cases

### TC-14: Breakpoint at exactly 768 px swaps desktop nav and hamburger

**Prerequisites**:
- Browser at `http://localhost:8080/` with the viewport about to be resized.

**When** the viewport is set to 767×800
**Then** the hamburger trigger is visible and the desktop nav is hidden
**and** when the viewport is resized to 768×800 the desktop nav becomes visible and the hamburger disappears
**and** the transition does not introduce layout shift on the logo

### TC-15: At 375×667 the header fits the viewport without horizontal scroll

**Prerequisites**:
- Browser at `http://localhost:8080/` with viewport 375×667.

**When** the user inspects the rendered header and opens the `Sheet`
**Then** `document.documentElement.scrollWidth` is ≤ 375 px (no horizontal overflow)
**and** the `Sheet`'s CTA link with aria-label `"Spustiť rýchly test"` is fully visible without scrolling within the `Sheet`

### TC-16: Keyboard tab order on the desktop header

**Prerequisites**:
- Browser at `http://localhost:8080/` with viewport 1280×800 and focus blurred.

**When** the user presses Tab repeatedly starting from `document.body`
**Then** focus moves through the logo link, then the four nav links in order (`"Testy"`, `"Školenia"`, `"Podporiť projekt"`, `"Kontakt"`), then the CTA pill
**and** Enter on the focused CTA pill navigates to `/test`

### TC-17: Focus trap inside the mobile `Sheet` and Escape closes it

**Prerequisites**:
- Mobile viewport 375×667 with the `Sheet` open.

**When** the user presses Tab repeatedly inside the `Sheet`
**Then** focus cycles through the close button, the logo link, the four nav links, and the CTA without escaping to elements behind the overlay
**and** pressing Escape closes the `Sheet`
**and** focus returns to the original `"Otvoriť menu"` trigger

### TC-18: Required ARIA attributes are present and correct

**Prerequisites**:
- Browser at `http://localhost:8080/` (viewport irrelevant — assert the static structure).

**When** the user inspects the header DOM
**Then** the `nav` element has aria-label `"Hlavná navigácia"`
**and** the logo link has aria-label `"subenai — domov"`
**and** the hamburger trigger has aria-label `"Otvoriť menu"`
**and** the close button inside the `Sheet` has aria-label `"Zavrieť menu"`
**and** the CTA pill has aria-label `"Spustiť rýchly test"`
**and** decorative icons (Menu, X, the trailing arrow `→`) have `aria-hidden="true"`

### TC-19: Browser back button after the `Sheet` auto-closed on navigation

**Prerequisites**:
- Mobile viewport 375×667 at `http://localhost:8080/`.

**When** the user opens the `Sheet`, clicks the link `"Školenia"` (Sheet auto-closes, URL is `/skolenia`)
**and** presses the browser back button
**Then** the URL returns to `/`
**and** the `Sheet` stays closed (open state is component-local, not in history)
**and** the active nav indicator clears from `"Školenia"`

### TC-20: Hash navigation does not toggle active state

**Prerequisites**:
- Browser at `http://localhost:8080/` with viewport 1280×800.

**When** the user navigates to `http://localhost:8080/#section`
**Then** no nav link gets the active class (the hash does not match any registered route)
**and** the header behaviour is identical to `/` (no flicker, no console error)

### TC-21: Sticky header with backdrop blur stays positioned during scroll

**Prerequisites**:
- Browser at `http://localhost:8080/` with viewport 1280×800 on a long page (such as `/skolenia`).

**When** the user scrolls the page by 1000 px
**Then** the header remains pinned to the top (`position: sticky; top: 0`)
**and** the `z-40` keeps it above page content
**and** the backdrop blur class (`backdrop-blur supports-[backdrop-filter]:bg-background/60`) renders without breaking content underneath

### TC-22: At 375 px the `Sheet` width does not exceed the viewport

**Prerequisites**:
- Mobile viewport 375×667 with the `Sheet` open.

**When** the user inspects the `Sheet` element
**Then** the `Sheet`'s computed width is ≤ 375 px (the `w-screen max-w-full` classes keep it within the viewport)
**and** none of the inner elements (logo, close button, nav links, CTA) cause horizontal overflow

### TC-23: Path-prefix collision — `/skolenia/$slug` highlights only `"Školenia"`, never `"Testy"`

**Prerequisites**:
- Browser at `http://localhost:8080/skolenia/sms-smishing` with viewport 1280×800.

**When** the user inspects the header
**Then** only the link `"Školenia"` is in the active state
**and** the link `"Testy"` is NOT highlighted, even though `/testy` is a different prefix that shares no characters with `/skolenia` (this guards against a future bug where a naive `startsWith("/te")` check could mis-fire)
**and** when navigated to `/testy/eshop`, the highlight flips: `"Testy"` becomes active and `"Školenia"` does not

---

## Open questions

- _None._

# `specs/` — integration test plans

Human-readable test plans for the **subenai** integration / e2e suite.

The Playwright **planner** agent (`.claude/agents/playwright-test-planner.md`) reads this directory's conventions and writes plans here. The **generator** agent then turns each plan into Playwright `e2e/*.spec.ts`.

---

## Directory layout

| Sub-folder | What lives here |
|---|---|
| `examples/` | Read-only reference plans. Always mimic their tone and shape. |
| `quiz/` | Anonymous /test flow, `/r/$shareId` share-link, results view, trap dialog |
| `composer/` | `/test/zostav` builder (NON-edu — no PII collection toggle) |
| `edu/` | Edu mode: composer toggle, intake form, results dashboard, CSV export |
| `courses/` | `/skolenia` index + filter + course detail pages |
| `test-packs/` | `/testy` discovery + `/testy/$slug` per-pack flows |
| `sponsorship/` | `/podpora` Stripe Checkout, `/sponzori`, customer portal magic-link |
| `consent/` | Cookie banner, `/cookies`, `/privacy`, GTM consent gating |
| `cross-cutting/` | Header / footer / sitemap / 404 / `_redirects` legacy URLs |

**Hard rule:** any sub-folder with > 5 plan files must be split further (e.g. `edu/intake/`, `edu/dashboard/`).

---

## Plans are grounded in user stories

Before writing a plan, the planner reads `tasks/stories/E<N>.<m>-*.md` for the relevant feature. The plan's header `**Source stories:**` field links every story whose AC the plan covers. Inside the plan, every TC references its origin:

- `**AC reference:** AC-3` — TC implements Acceptance Criterion 3 from the source story.
- `**Risk reference:** "<risk text>"` — TC covers a row from the source story's `Riziká` table.

This gives reviewers a mechanical traceability check: every AC must have at least one TC; every Risk row must have at least one TC. Plans without `Source stories` (or without AC references when stories exist) fail the planner's quality bar.

## Required test-case format

Every test case in every plan uses **exactly** this Gherkin-style shape:

```
### TC-<NN>: <imperative-mood title in Slovak>

**AC reference:** AC-N    ← cite the source story's AC (omit if N/A)
**Risk reference:** "..." ← cite the source story's Risk row (only for edge-case TCs that originate from a Risk)

**Prerequisites**:
- <pre-condition #1>
- <pre-condition #2>

**When** <user action — present tense Slovak>
**and** <follow-up action>
**Then** <observable outcome>
**and** <additional observable outcome>
```

Rules:
- `Prerequisites` is a bullet list. Everything explicit (auth state, viewport, DB seed, locale, env mode).
- `When / and / Then / and` are sentence-level (no nested bullets).
- Multi-step flows: chain `and` after `When`, then a single `Then` with as many `and` follow-ups as needed.
- TC numbering is sequential per file (TC-01, TC-02, …) — no gaps, no duplicates.
- Slovak for user-visible strings. English allowed for technical terms.

## Required sections per plan

```
## Happy paths        ← 1–4 primary success TCs
## Negative scenarios ← 3–8 predictable error/validation TCs
## Edge cases         ← 5–15 boundary / concurrency / abuse / a11y TCs
```

Plus a header (Area / Components / Routes / APIs / Data / Last-updated) and `## Out of scope` + `## Open questions` sections.

## Edge-case categories the planner walks every time

1. Boundary values (empty / 0 / 1 / min ± 1 / max ± 1)
2. Whitespace + Unicode (Slovak diacritics, emoji, RTL, zero-width)
3. Injection (XSS, SQL-like, very long inputs)
4. Auth / session (expired JWT, wrong role, missing cookie, CSRF)
5. Rate limits + abuse (honeypot, burst, distributed)
6. Concurrency / race (double-submit, two tabs, refresh mid-POST)
7. Network failures (offline, 500, 504, slow 3G, CORS)
8. State desync (back/forward, refresh after submit, expired data)
9. Permissions / RLS (anon → edu PII, set_id tampering)
10. i18n / locale (sk vs cs/pl/en, `localeCompare`)
11. Accessibility (keyboard-only, aria-live, focus trap, reduced-motion)
12. Mobile / viewport (375 / 768 / 1280, touch vs mouse)
13. Privacy & GDPR (consent gating, retention boundary)
14. Browser quirks (Safari ITP, Firefox dialog, ad blockers)
15. Idempotency (retry, webhook duplicate, double-click)

Skip categories that don't apply to the feature, but the planner explicitly considers each.

---

## File template

Copy from `.claude/agents/playwright-test-planner.md` § "Plan file skeleton" or from any `examples/*.md` file.

## Editing existing plans

When a feature changes, update the existing plan in place — don't add v2 files. Bump `**Last updated:**`. The healer agent will refresh the corresponding `e2e/*.spec.ts` after.

## Quality gate (planner self-check)

A plan ships when:
- File lives in the correct `<area>/` sub-folder, name is kebab-case.
- All TCs use the exact `Prerequisites / When / and / Then / and` format.
- Three required sections present, none silently empty.
- ≥ 5 edge-case TCs covering ≥ 3 categories.
- Each TC runs independently (no implicit ordering).
- "Out of scope" lists ≥ 1 explicit non-goal.
- Slovak UI strings match production verbatim.

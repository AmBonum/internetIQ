# Tasks

Tento adresár obsahuje **plánovací backlog** pre subenai —
epicy, user stories, ich rozpad na implementačné, testovacie,
dokumentačné a review úlohy.

## Štruktúra

```
tasks/
├── README.md                                    ← konvencie + DoR/DoD (tento súbor)
├── PLAN-2026-04-25-rast-a-vzdelavanie.md       ← index plánu (epic mapa, exec order, open questions)
└── stories/                                     ← jeden súbor = jedna user story
    ├── E1.1-consent-link-closes-dialog.md
    ├── E2.1-attempts-schema-growth-fields.md
    ├── E2.2-survey-question-component.md
    ├── E2.3-add-growth-survey-questions.md
    ├── E3.1-persist-answers-jsonb.md
    ├── E3.2-extract-answer-feedback-component.md
    ├── E3.3-share-page-answer-review-ui.md
    ├── E4.1-data-trap-copy-and-taxonomy.md
    ├── E4.2-trap-dialog-component.md
    ├── E4.3-trap-dialog-integration.md
    ├── E5.1-course-content-schema.md
    ├── E5.2-courses-index-route.md
    ├── E5.3-course-onepager-template.md
    ├── E5.4-course-sms-smishing.md
    ├── E5.5-course-email-phishing.md
    ├── E5.6-course-vishing.md
    ├── E5.7-course-marketplace.md
    ├── E5.8-course-investment-scams.md
    ├── E5.9-course-romance-scams.md
    ├── E5.10-course-bec-workplace.md
    ├── E5.11-course-data-hygiene.md
    ├── E5.12-sitemap-seo.md
    └── E5.13-navigation-links.md
```

## Konvencie

- **Každá user story je INVEST**: Independent, Negotiable, Valuable,
  Estimable, Small, Testable. Story čo sa nedá splniť za 1–3 dni
  vývoja treba rozbiť na menšie.
- **Každá story má štyri subtasky**: `Implementation`, `Tests`,
  `Documentation`, `Code review`. Žiadna sa neoznačí ako hotová
  bez všetkých štyroch.
- **Code review** beží vo **fresh kontexte** (subagent / iný
  developer). Reviewer nepozná premise — story prompt musí stáť
  sám o sebe.
- **Štítky efforty**:
  - `XS` ≤ 2h · `S` ≤ ½ dňa · `M` ≤ 2 dni · `L` ≤ 1 týždeň ·
    `XL` rozbiť na menšie
- **Priority**:
  - `P0` (blocker, fix dnes) · `P1` (must) ·
    `P2` (should) · `P3` (nice)
- **Závislosti**: explicitne v `Závislosti:` sekcii každej story
  (story IDs).
- **Story ID schéma**: `EPIC-{n}.{m}` — `n` je epic, `m` poradové
  číslo v rámci epicu. Po splnení sa nadpis zmení na
  `~~ID Title~~ ✅`.
- **Status emoji**: 🟡 Ready / ⛔ Blocked / 🚧 In progress /
  ✅ Done.
- **Statické content súbory** (kurzy v `src/content/courses/`)
  sú samé osebe dokumentáciou — netreba pre ne extra README.

## Aktívne plány

| Súbor | Obsah | Status |
|---|---|---|
| [PLAN-2026-04-25-rast-a-vzdelavanie.md](./PLAN-2026-04-25-rast-a-vzdelavanie.md) | 5 epicov, 23 stories: consent bug, growth survey, answer review, data-trap edu popup, courses section | 🟡 Plán schválený, čaká na štart |

## Plánovací proces

1. **Discovery** — prečítať existujúci kód relevantný k feature-u.
   Plán bez ukotvenia v reálnom kóde je odhad, nie plán.
2. **Story breakdown** — feature → epicy → user stories → subtasky.
3. **Schválenie product ownerom** — žiadna implementácia bez
   explicitného OK na akceptačné kritériá.
4. **Realizácia** — story za story, každá končí green CR + green
   build. Žiadne batch-merge bez review.
5. **Archív** — splnené plány idú do `tasks/done/{rok}/`.

## Definition of Ready / Definition of Done

Kanonický kontrolný zoznam je v samostatnom súbore (anglicky, ako CLAUDE.md):

📋 **[`tasks/DEFINITION_OF_DONE.md`](./DEFINITION_OF_DONE.md)** — pokrýva:

- § 1 — Definition of Ready (pred štartom story)
- § 2 — Story DoD (per-story: implementation, unit tests, docs, CR)
- § 3 — Feature / Epic DoD (Playwright integration + e2e testy, schema +
  secrets, privacy, a11y, perf, security review)
- § 4 — test pyramída (čo patrí kam — Vitest vs Playwright integration vs e2e)
- § 5 — Pre-merge gates (lint / test / build / e2e zelené)
- § 6 — Post-merge verification (smoke check, migrácie, monitoring, rollback)
- § 7 — Cross-cutting concerns (DB schema / nový API endpoint / nová route /
  PII / tretí service)
- § 8 — Quick reference scenáre
- § 9 — Anti-patterns

Všetky stories v `tasks/stories/` referujú tento dokument — žiadna story sa
neoznačí ako ✅ Done bez splnenia § 2, žiadny epic sa nemerguje bez § 3.

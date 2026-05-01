# Stories status overview

Generated 2026-05-01. This file is the **single source of truth** for a quick overview — the detail of each story lives in its own `.md` file.

> **State: 58 / 60 stories ✅ Done, 2 🟡 Ready (awaiting implementation).**
>
> Once the last 2 are finished, the entire `tasks/stories` directory can be marked as complete.

## Summary by epic

| Epic | Plan | Done / Total | Status |
|---|---|---|---|
| **E1** Consent dialog UX bug | [PLAN-2026-04-25](../PLAN-2026-04-25-rast-a-vzdelavanie.md#epic-1) | 1/1 | ✅ Epic complete |
| **E2** Growth & insight survey | [PLAN-2026-04-25](../PLAN-2026-04-25-rast-a-vzdelavanie.md#epic-2) | 3/3 | ✅ Epic complete |
| **E3** Post-test answer review | [PLAN-2026-04-25](../PLAN-2026-04-25-rast-a-vzdelavanie.md#epic-3) | 5/5 | ✅ Epic complete |
| **E4** Data-trap educational popup | [PLAN-2026-04-25](../PLAN-2026-04-25-rast-a-vzdelavanie.md#epic-4) | 3/3 | ✅ Epic complete |
| **E5** Free courses section | [PLAN-2026-04-25](../PLAN-2026-04-25-rast-a-vzdelavanie.md#epic-5) | 13/13 | ✅ Epic complete |
| **E6** Social distribution | [PLAN-2026-04-25](../PLAN-2026-04-25-rast-a-vzdelavanie.md#epic-6) | 2/2 | ✅ Epic complete |
| **E7** Industry test packs | [PLAN-2026-04-26](../PLAN-2026-04-26-custom-tests-sponsorship.md#epic-7--industry-test-packs) | 4/6 | 🟡 2 stories pending (E7.3, E7.4) |
| **E8** Composer | [PLAN-2026-04-26](../PLAN-2026-04-26-custom-tests-sponsorship.md#epic-8--composer-firmy-zostavujú-vlastné-testy) | 3/3 | ✅ Epic complete |
| **E9** Question bank +100 | [PLAN-2026-04-26](../PLAN-2026-04-26-custom-tests-sponsorship.md#epic-9--question-bank-100) | 4/4 | ✅ Epic complete |
| **E10** Sponsorship infrastructure | [PLAN-2026-04-26](../PLAN-2026-04-26-custom-tests-sponsorship.md#epic-10--sponsorship-infrastructure) | 5/5 | ✅ Epic complete |
| **E11** Sponsorship UI + invoicing | [PLAN-2026-04-26](../PLAN-2026-04-26-custom-tests-sponsorship.md#epic-11--sponsorship-ui--invoicing) | 8/8 | ✅ Epic complete |
| **E12** Education mode | [PLAN-2026-04-26](../PLAN-2026-04-26-custom-tests-sponsorship.md#epic-12--education-mode-autori-zbierajú-výsledky) | 7/7 | ✅ Epic complete |

**11 / 12 epics are 100 % done. The last one (E7) has 2/6 stories pending.**

## Pending — what's left

- **[E7.3](./E7.3-industry-packs-batch-b.md)** — Industry packs B (5 packs: dispatch, transport, marketing, healthcare, schools). Effort `M`, Priority `P2`.
- **[E7.4](./E7.4-industry-packs-batch-c.md)** — Industry packs C (5 packs: machine shops, tyre service, SME accounting, HORECA, repair shops). Effort `M`, Priority `P3`.

Both are content-only — adding 5 + 5 packs to `src/content/test-packs/`. No code change in UI / API. After they ship, this README can be reduced to "✅ All stories Done".

## Convention

- Each story file has a `**Status:**` line in its header showing the current state and completion date.
- States: `✅ Done (YYYY-MM-DD)` · `🟡 Ready` · `⛔ Blocked by EX.Y`.
- After an epic is complete, the state is also captured in the relevant PLAN file (the "Epic & story map" table) and in `CHANGELOG.md`.
- This README is **maintained manually** — no script updates the state. When closing a story, update the story file + the PLAN + this README in the same change.

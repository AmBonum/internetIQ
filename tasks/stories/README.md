# Stories status overview

Generated 2026-05-01. Tento súbor je **single source of truth** pre rýchly prehľad — detail každej story je v jej `.md` súbore.

> **Stav: 58 / 60 stories ✅ Done, 2 🟡 Ready (čakajú na implementáciu).**
>
> Po dokončení posledných 2 sa celý tasks/stories adresár dá označiť ako kompletne hotový.

## Súhrn po epicoch

| Epic | Plán | Done / Total | Status |
|---|---|---|---|
| **E1** Consent dialog UX bug | [PLAN-2026-04-25](../PLAN-2026-04-25-rast-a-vzdelavanie.md#epic-1) | 1/1 | ✅ Epic complete |
| **E2** Growth & insight survey | [PLAN-2026-04-25](../PLAN-2026-04-25-rast-a-vzdelavanie.md#epic-2) | 3/3 | ✅ Epic complete |
| **E3** Post-test answer review | [PLAN-2026-04-25](../PLAN-2026-04-25-rast-a-vzdelavanie.md#epic-3) | 5/5 | ✅ Epic complete |
| **E4** Data-trap edukačný popup | [PLAN-2026-04-25](../PLAN-2026-04-25-rast-a-vzdelavanie.md#epic-4) | 3/3 | ✅ Epic complete |
| **E5** Sekcia bezplatných kurzov | [PLAN-2026-04-25](../PLAN-2026-04-25-rast-a-vzdelavanie.md#epic-5) | 13/13 | ✅ Epic complete |
| **E6** Social distribution | [PLAN-2026-04-25](../PLAN-2026-04-25-rast-a-vzdelavanie.md#epic-6) | 2/2 | ✅ Epic complete |
| **E7** Industry test packs | [PLAN-2026-04-26](../PLAN-2026-04-26-custom-tests-sponsorship.md#epic-7--industry-test-packs) | 4/6 | 🟡 2 stories pending (E7.3, E7.4) |
| **E8** Composer | [PLAN-2026-04-26](../PLAN-2026-04-26-custom-tests-sponsorship.md#epic-8--composer-firmy-zostavujú-vlastné-testy) | 3/3 | ✅ Epic complete |
| **E9** Question bank +100 | [PLAN-2026-04-26](../PLAN-2026-04-26-custom-tests-sponsorship.md#epic-9--question-bank-100) | 4/4 | ✅ Epic complete |
| **E10** Sponsorship infrastructure | [PLAN-2026-04-26](../PLAN-2026-04-26-custom-tests-sponsorship.md#epic-10--sponsorship-infrastructure) | 5/5 | ✅ Epic complete |
| **E11** Sponsorship UI + invoicing | [PLAN-2026-04-26](../PLAN-2026-04-26-custom-tests-sponsorship.md#epic-11--sponsorship-ui--invoicing) | 8/8 | ✅ Epic complete |
| **E12** Education mode | [PLAN-2026-04-26](../PLAN-2026-04-26-custom-tests-sponsorship.md#epic-12--education-mode-autori-zbierajú-výsledky) | 7/7 | ✅ Epic complete |

**11 / 12 epicov je 100 % hotových. Posledný 1 (E7) má 2/6 stories pending.**

## Pending — čo zostáva

- **[E7.3](./E7.3-industry-packs-batch-b.md)** — Industry packs B (5 packov: dispečing, doprava, marketing, zdravotníctvo, školy). Effort `M`, Priority `P2`.
- **[E7.4](./E7.4-industry-packs-batch-c.md)** — Industry packs C (5 packov: strojová výroba, pneuservis, SME účto, HORECA, servis). Effort `M`, Priority `P3`.

Obidve sú obsahové — pridanie 5 + 5 packov do `src/content/test-packs/`. Žiadny code change v UI / API. Po ich dokončení sa tento README môže zjednodušiť na „✅ Všetky stories Done".

## Konvencia

- Každý story file má v hlavičke `**Status:**` riadok s aktuálnym stavom a dátumom dokončenia.
- Stavy: `✅ Done (YYYY-MM-DD)` · `🟡 Ready` · `⛔ Blocked by EX.Y`.
- Po dokončení epicu sa stav zachytí aj v príslušnom PLAN súbore (tabuľka „Epic & story mapa") a v `CHANGELOG.md`.
- Tento README je **manuálne** udržiavaný — stav neaktualizuje žiadny script. Pri uzatváraní stories aktualizuj zároveň story file + PLAN + tento README.

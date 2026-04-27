# E7 — Test pack authoring guide

Krátky manuál pre vytváranie nového industry test packu pod
`/test/firma/{slug}`. Schéma žije v
[`src/content/test-packs/_schema.ts`](../src/content/test-packs/_schema.ts);
plne typovo overená cez TS + Zod.

## Workflow

1. **Skopíruj template** z
   [`_template.ts`](../src/content/test-packs/_template.ts) do nového
   súboru `src/content/test-packs/{slug}.ts`. Slug spĺňa `[a-z0-9-]+`
   (žiadne podčiarkovníky — sú rezervované pre interné súbory).
2. **Vyplň polia** — pozri komentáre v `_schema.ts` pre ich význam.
   Kľúčové:
   - `industry` — vyber z 15 buckets v `Industry` union
   - `questionIds` — 8–25 položiek z `src/lib/quiz/questions.ts` (kuráciou,
     nie heuristikou)
   - `passingThreshold` — default 70; iba zníž ak otázky packu sú
     výrazne ťažšie než priemer
3. **Zaregistruj** v
   [`index.ts`](../src/content/test-packs/index.ts):
   ```ts
   import { eshopPack } from "./eshop";
   export const TEST_PACKS: TestPack[] = [eshopPack /*, ...*/];
   ```
4. **Verifikuj** lokálne:
   ```bash
   npm test -- tests/content/test-packs-schema.test.ts
   npm run build
   ```
   Build assertne unikátnosť slug + Zod schéma + že všetky
   `questionIds` existujú v banke.

## Question mix odporúčania

Mix odráža dvojaký cieľ packu — odhaliť reálne hrozby + naučiť
rozoznať dôveryhodné situácie. Pre 12-otázkový pack:

| Kategória | Odporúčanie | Účel |
|---|---|---|
| `phishing` / `scenario` (scam) | 7–8 otázok | Hlavný edukačný obsah |
| `honeypot` (legit-look examples) | 3–4 otázky | Anti-paranoja, učí dôveru |
| `url` / `fake_vs_real` | 1–2 otázky | Doplnkové signály |

`honeypotRatio` v manifeste je informatívny default, neenforce-ovaný.
Composer (E8.2) ho používa ako informáciu pre používateľa pri
custom-zostavení.

## Voľba `passingThreshold`

| Pack ťažkosť | Threshold |
|---|---|
| Hlavne easy / medium otázky pre širokú populáciu | 70 (default) |
| Pokročilé scenáre (BEC, deepfake, IT supply chain) | 60–65 |
| Krátky 8-otázkový diagnostický | 75 |

Threshold je **DEFAULT SUGGESTION**, nie hard pass/fail — composer
(E8.2) môže prepísať.

## Copy guidelines

- **Slovenčina**, druhá osoba jednotného čísla („ty"), neformálne ale
  bez patronizing
- **Žiadna defamácia** reálnych značiek — phishing vzory hovoria „vyzerá
  ako Slovenská pošta", nikdy nekopírujú logá / tone 1:1
- **Faktické tvrdenia** majú odkaz v `sources[]` (NCKB, NBÚ, polícia.sk,
  ENISA pre healthcare/IT)
- **Žiadny fear-mongering** — každý red flag musí viesť ku
  konkrétnej akcii (over druhotne, zavolaj na známe číslo, atď.)

## Pridanie nového section type / industry bucket

Industry enum:

1. Edituj `Industry` union v `_schema.ts` — pridaj nový reťazec
2. Edituj `industrySchema` z.enum — pridaj rovnaký reťazec
3. Composer chips (E8.2) automaticky pickne nový bucket — žiadny ďalší
   refaktor

## Question content pridanie / oprava

Ak sa otázka v `src/lib/quiz/questions.ts` premenuje, niektorý pack
môže ostať s orphan ID. Build assertion to zachytí cez `validatePackQuestionIds`
test. Composer pri pre-load (E8.2 AC-13) zobrazí toast warning, takže
content drift nezakazí merge ale je viditeľný.

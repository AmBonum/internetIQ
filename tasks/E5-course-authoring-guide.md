# E5 — Course Authoring Guide

Quick reference for adding a new free course under `/kurzy`. Schema is
the single source of truth — see [`src/content/courses/_schema.ts`](../src/content/courses/_schema.ts).

## Workflow

1. **Create** `src/content/courses/<slug>.ts` with the course content.
   - `slug` matches `[a-z0-9-]+` (no underscores — those are reserved
     for internal/template files).
   - Copy [`_demo.ts`](../src/content/courses/_demo.ts) as a starting
     point — it covers every section type and is type-checked.
2. **Register** the export in [`src/content/courses/index.ts`](../src/content/courses/index.ts):
   ```ts
   import { smsSmishingCourse } from "./sms-smishing";
   export const COURSES: Course[] = [smsSmishingCourse];
   ```
   The registry asserts slug uniqueness at module load; a duplicate
   throws on import.
3. **Verify** with `npm test -- tests/content/courses-schema.test.ts`.
   The schema test parses every registered course through Zod, so any
   missing required field surfaces immediately.

## Section types

Every course is a list of `CourseSection` blocks. Mix and match — order
matters (it's the rendering order on the one-pager).

| `kind`       | When to use                                                                 |
|--------------|------------------------------------------------------------------------------|
| `intro`      | First block. Hook + 1–2 sentence framing for the topic.                      |
| `example`    | Concrete fake message / URL / listing rendered via the existing `Visual`.    |
| `redflags`   | Bullet list of warning signs (3–6 items).                                    |
| `checklist`  | Mixed good/bad items the reader should recognise (use `good: true/false`).   |
| `do_dont`    | Prescriptive: "do these / don't do these" lists.                             |
| `scenario`   | Short story + the right action. Best as the closing block.                   |

A typical course is ~6 sections, ~3 minutes of reading.

## Copy guidelines

- **Slovak**, second-person singular ("ty"), informal but never
  patronising.
- **No defamation** of real brands. Phishing samples must say
  "vyzerá ako Slovenská pošta" rather than impersonating their logos.
- **Factual accuracy**: every claim that depends on law / statistics
  belongs in `sources` with a link to the primary source (NBÚ, NCKB,
  GDPR text, polícia.sk).
- **No fear-mongering for its own sake** — every red flag must lead to
  a concrete action.

## Cross-linking back to the quiz

Set `relatedQuestionsCategory` if the course teaches against a
specific quiz category (`phishing` / `url` / `fake_vs_real` /
`scenario`). E3.5 uses this field to surface the course as a CTA in
the per-question review card.

## Adding a new section type

Edit `_schema.ts`:

1. Add the variant to the `CourseSection` discriminated union.
2. Add the matching `z.object({...})` to the `sectionSchema` Zod union.
3. Add a renderer branch in the one-pager template (E5.3).

The discriminator is `kind` — old courses keep working without any
migration as long as you don't rename existing variants.

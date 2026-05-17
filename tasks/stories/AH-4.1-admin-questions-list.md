# AH-4.1 — Admin questions list + QuestionEditor + StatusBadge + AiQuestionGenerator

## Goal
Port the admin questions surface: list route, the in-line `QuestionEditor` dialog,
`StatusBadge` (already piloted), and the `AiQuestionGenerator` skeleton behind a
build-time feature flag so the AI path stays dark until a dedicated AI epic ships.

## Acceptance criteria
- Route `src/routes/admin/questions.tsx` ported from admin-hub with CRUD against
  `@/lib/admin/mock-store` only (no Supabase imports).
- `src/components/admin/QuestionEditor.tsx`, `src/components/admin/StatusBadge.tsx`
  (already piloted — re-verify import paths), `src/components/admin/AiQuestionGenerator.tsx`
  ported.
- `src/lib/admin/ai-generate.functions.ts` ported; its body short-circuits when
  `import.meta.env.VITE_AI_GENERATOR_ENABLED !== 'true'` (default off).
- `AiQuestionGenerator` is not rendered when the flag is off — feature-flag check at
  the route, not inside the component.
- Every interactive element has a `data-testid`: `admin-questions-list-row-${id}`,
  `admin-questions-new-button`, `question-editor-save-button`,
  `question-editor-cancel-button`, `question-editor-type-select`,
  `question-editor-difficulty-select`, `question-editor-status-select`,
  `admin-questions-row-edit-${id}`, `admin-questions-row-delete-${id}`.
- All Slovak strings extracted to `src/i18n/locales/sk/questions.json` and the
  namespace registered in `src/i18n/resources.ts` + `src/i18n/types.d.ts`.
- `npx eslint --fix` applied to every ported file; lint 0/0.
- `tasks/FEATURE_MAP-admin-hub.md` rows for `admin/questions.tsx`, `QuestionEditor.tsx`,
  `StatusBadge.tsx`, `AiQuestionGenerator.tsx`, `ai-generate.functions.ts` marked Done
  with `see git log`.
- `CHANGELOG.md` entry under user-visible: yes ("Admin questions library with CRUD
  and status workflow").
- No Supabase client imports anywhere in the diff (AH-11 owns the wire-up).

## Implementation
Specific files (absolute paths from repo root):
- `cp /Users/lubomir/Desktop/subenai/admin-hub/src/routes/admin/questions.tsx /Users/lubomir/Desktop/subenai/src/routes/admin/questions.tsx`
- `cp /Users/lubomir/Desktop/subenai/admin-hub/src/components/admin/QuestionEditor.tsx /Users/lubomir/Desktop/subenai/src/components/admin/QuestionEditor.tsx`
- `cp /Users/lubomir/Desktop/subenai/admin-hub/src/components/admin/AiQuestionGenerator.tsx /Users/lubomir/Desktop/subenai/src/components/admin/AiQuestionGenerator.tsx`
- `cp /Users/lubomir/Desktop/subenai/admin-hub/src/lib/ai-generate.functions.ts /Users/lubomir/Desktop/subenai/src/lib/admin/ai-generate.functions.ts`
- Path rewrites: `@/lib/admin/store` → `@/lib/admin/mock-store`; `@/lib/admin-mock-data` → `@/lib/admin/mock-data`.
- New: `/Users/lubomir/Desktop/subenai/src/i18n/locales/sk/questions.json` + register.
- `npx eslint --fix` on every copied file.

## Tests
- Vitest at `tests/routes/admin/questions.test.tsx` — happy render (list with seeded
  questions) + edge: empty state when store returns `[]`, validation failure when
  saving an editor row with empty stem.
- Vitest at `tests/routes/admin/questions-ai-flag.test.tsx` — with the env flag off
  (default), `AiQuestionGenerator` button is not in the DOM.
- POM-only locators for any e2e follow-up; no Playwright spec required at this stage.

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` — rows above marked Done with `see git log`.
- `CHANGELOG.md` — user-visible entry.
- privacy / cookies — N/A (mock-only).

## Code review
Fresh-context prompt:
> Review the diff for AH-4.1. Confirm: (1) no `@/lib/admin/store` import remains —
> all imports point at `@/lib/admin/mock-store`; (2) `AiQuestionGenerator` is gated
> by `VITE_AI_GENERATOR_ENABLED` and not rendered by default; (3) every interactive
> element has a `data-testid` matching the convention; (4) Slovak strings live in
> `src/i18n/locales/sk/questions.json` only — no hardcoded strings in TSX; (5) no
> Supabase imports anywhere. Review only — no edits.

**Effort**: M
**Depends on**: AH-1, AH-3
**Source in admin-hub**: `routes/admin/questions.tsx`, `components/admin/QuestionEditor.tsx`,
`components/admin/StatusBadge.tsx`, `components/admin/AiQuestionGenerator.tsx`,
`lib/ai-generate.functions.ts`

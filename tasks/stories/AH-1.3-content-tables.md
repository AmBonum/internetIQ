# AH-1.3 — Content tables (categories, topics, answer_sets, answers, questions, templates, trainings)

## Goal
Land the seven tables holding question content and training material:
`categories`, `topics`, `answer_sets`, `answers`, `questions`, `templates`,
`trainings`. These back the AH-4 (questions library) and AH-6 (categories +
trainings) epics.

## Acceptance criteria
- Tables created with columns matching `admin-hub/docs/DATABASE.md` §1 (Obsah):
  - `categories(id, name, slug UNIQUE, color, description, created_at)`
  - `topics(id, name, slug UNIQUE, color, description, created_at)`
  - `answer_sets(id, name, description, branch_slugs text[], author_id FK
    auth.users, created_at, updated_at)`
  - `answers(id, set_id FK answer_sets ON DELETE CASCADE, text, is_correct bool,
    explanation, position int)`
  - `questions(id, type question_type, prompt, options jsonb, matrix_rows jsonb,
    matrix_cols jsonb, correct jsonb, category_id FK categories, branch_slug,
    difficulty, author_id FK auth.users, status question_status, answer_set_id FK
    answer_sets, created_at)`
  - `templates(id, title, description, question_ids uuid[], gdpr_purpose
    gdpr_purpose)`
  - `trainings(id, title, description, topic_slug, status training_status, content
    jsonb, created_at)`
- Indexes: `questions(category_id, branch_slug)`, `answers(set_id, position)`,
  `templates(gdpr_purpose)`.
- RLS ENABLED on all 7 tables; policies in AH-1.7.
- `DEPLOY_SETUP.sql` mirrored.
- `npm run lint` 0/0; `tsc --noEmit` clean.
- `tasks/FEATURE_MAP-admin-hub.md` rows for all 7 tables marked Done with commit
  SHA.

## Implementation
Specific files:
- `/Users/lubomir/Desktop/subenai/supabase/migrations/20260517000000_admin_hub_schema.sql` (appends content section after AH-1.2's identity block)
- `/Users/lubomir/Desktop/subenai/DEPLOY_SETUP.sql` (mirror)

## Tests
- Vitest at `tests/lib/supabase/content-tables.test.ts`: typed select shapes for
  `questions`, `answer_sets`, `answers`, `categories`, `topics`, `templates`,
  `trainings`.
- Integration spec at `e2e/integration/admin-hub/content-fk-cascade.spec.ts`:
  delete an `answer_sets` row via `supabaseAdmin`, assert `answers` rows are
  CASCADE-removed.
- data-testids: N/A.

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` rows updated with commit SHA.
- `CHANGELOG.md` — N/A.
- privacy / cookies docs — N/A.

## Code review
Fresh-context prompt:

> Review the content section in
> `/Users/lubomir/Desktop/subenai/supabase/migrations/20260517000000_admin_hub_schema.sql`.
> Confirm: (1) RLS enabled on all 7 tables; (2) FKs use `ON DELETE CASCADE` only
> where appropriate (answers → answer_sets yes; questions → categories should be
> `ON DELETE SET NULL` to preserve question data); (3) `branch_slugs text[]` is
> not used as a FK (text array references are intentional per design); (4) JSONB
> columns (`options`, `matrix_rows`, `matrix_cols`, `correct`, `content`,
> `blocks`) have no implicit defaults beyond `null`; (5) ESLint 0/0. Review only —
> do not modify code.

**Effort**: M
**Depends on**: AH-1.1
**Source in admin-hub**: `docs/DATABASE.md` §1 (Obsah)

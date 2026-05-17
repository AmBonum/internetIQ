# AH-1.4 — Test + session tables + `forbid_session_score_changes` trigger

## Goal
Land the nine tables that store tests, their question-bindings, and respondent
sessions: `tests`, `test_questions`, `test_versions`, `respondents`, `sessions`,
`session_answers`, `behavioral_events`, `respondent_groups`, `group_assignments`.
Add the `forbid_session_score_changes` trigger mirroring the existing
`forbid_attempt_score_changes` pattern. This is the largest data block — it backs
AH-5 (tests builder) and AH-8 (respondent flow).

## Acceptance criteria
- Tables created per `admin-hub/docs/DATABASE.md` §1 (Obsah + Respondenti):
  - `tests(id, slug UNIQUE, share_id UNIQUE, owner_id FK auth.users, team_id FK
    teams, title, description, status test_status, version int, password_hash,
    segmentation text[], gdpr_purpose, intake_fields jsonb, branches jsonb,
    notif_config jsonb, anonymize_after_days int, allow_behavioral_tracking bool,
    expires_at, published_at, created_at, updated_at)`
  - `test_questions(test_id FK tests ON DELETE CASCADE, question_id FK questions,
    position int, PRIMARY KEY(test_id, question_id))`
  - `test_versions(id, test_id FK tests, version int, snapshot jsonb, published_at,
    published_by FK auth.users, changelog)`
  - `respondents(id, email, display_name, anonymized_at, created_at)`
  - `sessions(id, test_id FK tests, version int, respondent_id FK respondents,
    intake_data jsonb, consent_given bool, started_at, finished_at, score
    numeric(5,2), status session_status, segment, ip_hash)`
  - `session_answers(session_id FK sessions ON DELETE CASCADE, question_id FK
    questions, value text, is_correct bool, time_ms int, PRIMARY KEY(session_id,
    question_id))`
  - `behavioral_events(id, session_id FK sessions ON DELETE CASCADE, type, payload
    jsonb, at timestamptz)`
  - `respondent_groups(id, name, description, owner_id FK auth.users, member_emails
    text[], tags text[], created_at, updated_at)`
  - `group_assignments(id, test_id FK tests, group_id FK respondent_groups,
    assigned_by FK auth.users, assigned_at, invited_count int)`
- Indexes: `tests(owner_id)`, `tests(share_id)`, `tests(slug)`,
  `sessions(test_id, status)`, `sessions(respondent_id)`,
  `session_answers(session_id)`, `behavioral_events(session_id)`.
- Trigger `forbid_session_score_changes BEFORE UPDATE ON sessions`: raises an
  exception if `OLD.status = 'completed' AND NEW.score IS DISTINCT FROM OLD.score`.
  Mirrors existing `forbid_attempt_score_changes` pattern.
- RLS ENABLED on all 9 tables; policies in AH-1.7.
- `DEPLOY_SETUP.sql` mirrored.
- `npm run lint` 0/0; `tsc --noEmit` clean.
- `tasks/FEATURE_MAP-admin-hub.md` rows for all 9 tables + the score trigger marked
  Done with commit SHA.

## Implementation
Specific files:
- `/Users/lubomir/Desktop/subenai/supabase/migrations/20260517000000_admin_hub_schema.sql` (appends test+session section after AH-1.3's content block)
- `/Users/lubomir/Desktop/subenai/DEPLOY_SETUP.sql` (mirror)

## Tests
- Vitest at `tests/lib/supabase/sessions-trigger.test.ts`: mock supabase client;
  attempt to UPDATE a `completed` session's score; assert the SQL error surface.
- Integration spec at `e2e/integration/admin-hub/sessions-score-immutable.spec.ts`:
  via `supabaseAdmin`, INSERT a completed session, attempt to UPDATE its score,
  assert the update fails with the trigger's exception code.
- data-testids: N/A.

## Documentation
- `tasks/FEATURE_MAP-admin-hub.md` rows updated with commit SHA.
- `CHANGELOG.md` — N/A.
- privacy / cookies docs — N/A in this story (respondent PII surface documented in AH-7).

## Code review
Fresh-context prompt:

> Review the test+session section in
> `/Users/lubomir/Desktop/subenai/supabase/migrations/20260517000000_admin_hub_schema.sql`.
> Confirm: (1) `forbid_session_score_changes` trigger ONLY blocks `score` mutation
> when `status = 'completed'`; demographic / intake fields remain updatable; (2)
> RLS enabled on all 9 tables; (3) `sessions.respondent_id` is NULLABLE (needed
> for anonymization cron in AH-1.8); (4) `tests.password_hash` is TEXT, never the
> plaintext; (5) `session_answers` and `behavioral_events` CASCADE on session
> delete; (6) all indexes from `docs/DATABASE.md` §4 are present; (7) ESLint 0/0.
> Review only — do not modify code.

**Effort**: L
**Depends on**: AH-1.1, AH-1.2, AH-1.3
**Source in admin-hub**: `docs/DATABASE.md` §1 (Respondenti a sessions), §4 (Indexy)

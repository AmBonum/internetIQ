-- E8.1 — `test_sets` table for the Composer (E8 epic).
--
-- A test_set is a saved selection of question IDs (with custom passing
-- threshold + max count) that a company composes via /test/zostav and
-- shares via /test/zostava/$id. Question CONTENT remains in the TS
-- bundle (src/lib/quiz/questions.ts) — only the SELECTION lives here.
-- See the cross-cutting decisions in
-- tasks/PLAN-2026-04-26-custom-tests-sponsorship.md for rationale.
--
-- Forward-compat note: the `author_password_hash` + `collects_responses`
-- columns are added now (NULL/false defaults) so the E12 education-mode
-- migration is non-breaking. They are unused by E8 itself.

CREATE TABLE IF NOT EXISTS public.test_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_ids TEXT[] NOT NULL,
  passing_threshold INT2 NOT NULL DEFAULT 70,
  max_questions INT2 NOT NULL,
  creator_label TEXT,
  source_pack_slugs TEXT[],
  -- Forward-compat for E12 (education mode). E8 ignores these.
  author_password_hash TEXT,
  collects_responses BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT test_sets_size_chk CHECK (
    array_length(question_ids, 1) BETWEEN 5 AND 50
  ),
  CONSTRAINT test_sets_threshold_chk CHECK (
    passing_threshold BETWEEN 50 AND 90
  ),
  CONSTRAINT test_sets_max_consistent CHECK (
    max_questions = array_length(question_ids, 1)
  ),
  CONSTRAINT test_sets_label_len CHECK (
    creator_label IS NULL OR length(creator_label) <= 80
  ),
  CONSTRAINT test_sets_question_id_len CHECK (
    NOT EXISTS (SELECT 1 FROM unnest(question_ids) AS q WHERE length(q) > 64)
  ),
  CONSTRAINT test_sets_pwd_required_when_collecting CHECK (
    collects_responses = false OR author_password_hash IS NOT NULL
  )
);

CREATE INDEX IF NOT EXISTS test_sets_created_at_idx
  ON public.test_sets (created_at DESC);

ALTER TABLE public.test_sets ENABLE ROW LEVEL SECURITY;

-- RLS: composer test_sets are public-by-link (the random UUID IS the secret).
--   * SELECT: anon may read any row (no enumeration risk for a 122-bit id).
--   * INSERT: anon may insert; CHECK constraints + a CF Pages Function
--     gateway (E8.2) enforce validity. The Function is also where we
--     verify question_ids exist in the live bundle (AC-6) and rate-limit
--     IP traffic (AC-7).
--   * UPDATE / DELETE: forbidden for anon. test_sets are immutable once
--     shared — editing would silently change a test underneath users
--     who already have the link.
DROP POLICY IF EXISTS test_sets_anon_select ON public.test_sets;
CREATE POLICY test_sets_anon_select
  ON public.test_sets
  FOR SELECT
  TO anon
  USING (true);

DROP POLICY IF EXISTS test_sets_anon_insert ON public.test_sets;
CREATE POLICY test_sets_anon_insert
  ON public.test_sets
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- attempts → test_sets link, so we can later analyse "which test_set
-- has the lowest pass rate" without joining via question_ids.
ALTER TABLE public.attempts
  ADD COLUMN IF NOT EXISTS test_set_id UUID
  REFERENCES public.test_sets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS attempts_test_set_id_idx
  ON public.attempts (test_set_id)
  WHERE test_set_id IS NOT NULL;

-- Extend the immutability trigger to also lock test_set_id after INSERT.
-- The set this attempt was generated from must never be silently rewritten.
CREATE OR REPLACE FUNCTION public.forbid_attempt_score_changes()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.final_score IS DISTINCT FROM OLD.final_score
     OR NEW.base_score IS DISTINCT FROM OLD.base_score
     OR NEW.total_penalty IS DISTINCT FROM OLD.total_penalty
     OR NEW.percentile IS DISTINCT FROM OLD.percentile
     OR NEW.personality IS DISTINCT FROM OLD.personality
     OR NEW.breakdown::text IS DISTINCT FROM OLD.breakdown::text
     OR NEW.insights::text IS DISTINCT FROM OLD.insights::text
     OR NEW.stats::text IS DISTINCT FROM OLD.stats::text
     OR NEW.flags::text IS DISTINCT FROM OLD.flags::text
     OR NEW.answers::text IS DISTINCT FROM OLD.answers::text
     OR NEW.total_time_ms IS DISTINCT FROM OLD.total_time_ms
     OR NEW.share_id IS DISTINCT FROM OLD.share_id
     OR NEW.test_set_id IS DISTINCT FROM OLD.test_set_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Score / identity / set fields are immutable';
  END IF;
  RETURN NEW;
END;
$$;

-- Retention: 12-month rolling window. test_sets contain no PII (just
-- question IDs + threshold + label) so the privacy concern is small,
-- but unused composer sets bloat the table indefinitely otherwise.
-- Privacy policy table-row commitment: 12 months for `test_sets`.
CREATE OR REPLACE FUNCTION public.purge_unused_test_sets()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  purged_count integer;
BEGIN
  -- Defensive ordering: NULL-ify any attempts.test_set_id pointing at
  -- soon-to-be-deleted rows even though ON DELETE SET NULL would do
  -- this implicitly. Keeps the operation explicit + auditable.
  UPDATE public.attempts
  SET test_set_id = NULL
  WHERE test_set_id IN (
    SELECT id FROM public.test_sets
    WHERE created_at < (now() - interval '12 months')
  );

  WITH deleted AS (
    DELETE FROM public.test_sets
    WHERE created_at < (now() - interval '12 months')
    RETURNING 1
  )
  SELECT count(*) INTO purged_count FROM deleted;
  RETURN purged_count;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_unused_test_sets() FROM anon, authenticated;

-- Schedule daily purge at 03:23 UTC (off-peak, offset by 6 min from
-- purge_expired_attempts to avoid concurrent vacuum/locking pressure).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('purge_unused_test_sets_daily')
    WHERE EXISTS (
      SELECT 1 FROM cron.job WHERE jobname = 'purge_unused_test_sets_daily'
    );
    PERFORM cron.schedule(
      'purge_unused_test_sets_daily',
      '23 3 * * *',
      'SELECT public.purge_unused_test_sets();'
    );
  END IF;
END $$;

-- E3.1 — Persist per-question answers so /r/$shareId can render a review
-- after a refresh or on a different device. JSONB column + GIN index for
-- future analytics ("which optionId fails most often").

ALTER TABLE public.attempts
  ADD COLUMN IF NOT EXISTS answers JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_attempts_answers
  ON public.attempts USING gin (answers);

-- The existing forbid_attempt_score_changes trigger already protects scoring
-- and identity columns from anonymous UPDATEs. Extend it to cover `answers`
-- as well — once an attempt is persisted, the recorded answers must not be
-- rewritten (the demographics UPDATE policy is the only legitimate UPDATE
-- path and it should never touch this column).
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
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Score / identity fields are immutable';
  END IF;
  RETURN NEW;
END;
$$;

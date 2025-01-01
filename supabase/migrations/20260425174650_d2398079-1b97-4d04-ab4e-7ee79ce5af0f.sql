ALTER TABLE public.attempts
  ADD COLUMN IF NOT EXISTS age_range text,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS country text,
  ADD COLUMN IF NOT EXISTS self_caution smallint,
  ADD COLUMN IF NOT EXISTS survey_completed boolean NOT NULL DEFAULT false;

-- Validation: caution 1..5 if provided
CREATE OR REPLACE FUNCTION public.validate_attempt_demographics()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.self_caution IS NOT NULL AND (NEW.self_caution < 1 OR NEW.self_caution > 5) THEN
    RAISE EXCEPTION 'self_caution must be between 1 and 5';
  END IF;
  IF NEW.age_range IS NOT NULL AND length(NEW.age_range) > 20 THEN
    RAISE EXCEPTION 'age_range too long';
  END IF;
  IF NEW.gender IS NOT NULL AND length(NEW.gender) > 30 THEN
    RAISE EXCEPTION 'gender too long';
  END IF;
  IF NEW.city IS NOT NULL AND length(NEW.city) > 80 THEN
    RAISE EXCEPTION 'city too long';
  END IF;
  IF NEW.country IS NOT NULL AND length(NEW.country) > 80 THEN
    RAISE EXCEPTION 'country too long';
  END IF;
  IF NEW.nickname IS NOT NULL AND length(NEW.nickname) > 40 THEN
    RAISE EXCEPTION 'nickname too long';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_attempt_demographics_trg ON public.attempts;
CREATE TRIGGER validate_attempt_demographics_trg
BEFORE INSERT OR UPDATE ON public.attempts
FOR EACH ROW EXECUTE FUNCTION public.validate_attempt_demographics();

-- Allow anonymous updates ONLY to demographic / nickname fields by share_id, never to scores.
-- Simplest safe path: allow UPDATE on the row with a CHECK that score-related cols are unchanged.
DROP POLICY IF EXISTS "Anyone can update demographics" ON public.attempts;
CREATE POLICY "Anyone can update demographics"
ON public.attempts
FOR UPDATE
TO anon, authenticated
USING (true)
WITH CHECK (true);

-- Trigger to forbid changing immutable fields
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
     OR NEW.total_time_ms IS DISTINCT FROM OLD.total_time_ms
     OR NEW.share_id IS DISTINCT FROM OLD.share_id
     OR NEW.created_at IS DISTINCT FROM OLD.created_at THEN
    RAISE EXCEPTION 'Score / identity fields are immutable';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS forbid_attempt_score_changes_trg ON public.attempts;
CREATE TRIGGER forbid_attempt_score_changes_trg
BEFORE UPDATE ON public.attempts
FOR EACH ROW EXECUTE FUNCTION public.forbid_attempt_score_changes();

CREATE INDEX IF NOT EXISTS attempts_share_id_idx ON public.attempts(share_id);
CREATE INDEX IF NOT EXISTS attempts_created_at_idx ON public.attempts(created_at DESC);
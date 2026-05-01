-- E12.1 — Education mode schema (authors collect student responses).
--
-- Adds PII to `attempts` (respondent name + email) when the test_set is
-- in edu mode (`collects_responses = true`). RLS strictly separates:
--   * non-edu rows (respondent_name IS NULL): anon may SELECT (the
--     existing /r/$shareId share-link flow is unchanged).
--   * edu rows (respondent_name IS NOT NULL): anon CANNOT SELECT at all.
--     The author accesses these via the password-verified dashboard
--     (E12.4) using the service-role token from a CF Pages Function.
--
-- Author password is bcrypt via pgcrypto crypt(...,gen_salt('bf',10)).
-- Verification in RPC `verify_test_set_password` (SECURITY DEFINER;
-- brute-force protection lives in the E12.4 CF Function rate limiter,
-- not here).
--
-- Retention: 12 months. After expiry, `purge_expired_respondent_pii`
-- nullifies name + email; score + answers remain for the author's
-- aggregate statistics.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. attempts: add respondent_* + check constraints.
ALTER TABLE public.attempts
  ADD COLUMN IF NOT EXISTS respondent_name TEXT,
  ADD COLUMN IF NOT EXISTS respondent_email TEXT;

-- Drop for re-runnability (the migration may be executed repeatedly in dev).
ALTER TABLE public.attempts
  DROP CONSTRAINT IF EXISTS attempts_respondent_email_format;
ALTER TABLE public.attempts
  ADD CONSTRAINT attempts_respondent_email_format CHECK (
    respondent_email IS NULL OR respondent_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  );

ALTER TABLE public.attempts
  DROP CONSTRAINT IF EXISTS attempts_edu_pii_pair;
ALTER TABLE public.attempts
  ADD CONSTRAINT attempts_edu_pii_pair CHECK (
    (respondent_name IS NULL AND respondent_email IS NULL)
    OR (respondent_name IS NOT NULL AND respondent_email IS NOT NULL)
  );

ALTER TABLE public.attempts
  DROP CONSTRAINT IF EXISTS attempts_respondent_name_len;
ALTER TABLE public.attempts
  ADD CONSTRAINT attempts_respondent_name_len CHECK (
    respondent_name IS NULL OR length(respondent_name) BETWEEN 1 AND 120
  );

CREATE INDEX IF NOT EXISTS attempts_test_set_id_created_at_idx
  ON public.attempts (test_set_id, created_at DESC)
  WHERE test_set_id IS NOT NULL;

-- 2. RLS — narrow anon SELECT to non-edu rows only.
DROP POLICY IF EXISTS "Anyone can read attempts" ON public.attempts;

CREATE POLICY "Anon read non-edu attempts"
  ON public.attempts FOR SELECT
  TO anon, authenticated
  USING (respondent_name IS NULL);

-- 3. Defense-in-depth: public view that drops respondent_* columns.
-- Clients that want aggregates can read from `attempts_anon` instead of
-- attempts. Even if the anon SELECT policy ever allowed an edu row, the
-- view would not expose it.
CREATE OR REPLACE VIEW public.attempts_anon
WITH (security_invoker = true) AS
SELECT
  id,
  share_id,
  nickname,
  final_score,
  base_score,
  total_penalty,
  percentile,
  personality,
  breakdown,
  insights,
  stats,
  flags,
  total_time_ms,
  test_set_id,
  created_at
FROM public.attempts
WHERE respondent_name IS NULL;

GRANT SELECT ON public.attempts_anon TO anon, authenticated;

-- 4. Update the immutability trigger: `respondent_*` is locked after INSERT.
-- The author must not change a respondent's name and the respondent must
-- not change their score.
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
     OR NEW.created_at IS DISTINCT FROM OLD.created_at
     -- Edu PII may change ONLY to NULL (anonymization after retention).
     -- Never from NULL to a value (prevents retroactive PII injection
     -- into old rows).
     OR (NEW.respondent_name IS DISTINCT FROM OLD.respondent_name
         AND NOT (OLD.respondent_name IS NOT NULL AND NEW.respondent_name IS NULL))
     OR (NEW.respondent_email IS DISTINCT FROM OLD.respondent_email
         AND NOT (OLD.respondent_email IS NOT NULL AND NEW.respondent_email IS NULL))
  THEN
    RAISE EXCEPTION 'Score / identity / set / respondent fields are immutable';
  END IF;
  RETURN NEW;
END;
$$;

-- 5. RPC for hashing + verifying the author password (bcrypt via pgcrypto bf).
-- Password hashing runs on the Postgres side — the CF Pages Function
-- (E12.2) calls `hash_test_set_password` via service role when creating
-- a test_set. Verification in `verify_test_set_password` is public for
-- anon (rate-limited in the E12.4 CF Function — 5 attempts / 15 min /
-- IP / set_id).

CREATE OR REPLACE FUNCTION public.hash_test_set_password(password TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  IF password IS NULL OR length(password) < 8 THEN
    RAISE EXCEPTION 'Password must be at least 8 characters';
  END IF;
  RETURN crypt(password, gen_salt('bf', 10));
END;
$$;

REVOKE ALL ON FUNCTION public.hash_test_set_password(TEXT) FROM PUBLIC, anon, authenticated;
-- service_role has EXECUTE by default; the CF Function uses the service-role token.

CREATE OR REPLACE FUNCTION public.verify_test_set_password(set_id UUID, password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  stored_hash TEXT;
BEGIN
  IF set_id IS NULL OR password IS NULL THEN
    RETURN false;
  END IF;
  SELECT author_password_hash INTO stored_hash
  FROM public.test_sets
  WHERE id = set_id;
  IF stored_hash IS NULL THEN
    RETURN false;
  END IF;
  RETURN crypt(password, stored_hash) = stored_hash;
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_test_set_password(UUID, TEXT) TO anon, authenticated;

-- 6. Retention — 12-month anonymization of respondent PII.
-- Score and answers stay (they are not PII without name/email) — the
-- author still sees aggregates after expiry.
CREATE OR REPLACE FUNCTION public.purge_expired_respondent_pii()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected integer;
BEGIN
  UPDATE public.attempts
  SET respondent_name = NULL,
      respondent_email = NULL
  WHERE respondent_name IS NOT NULL
    AND created_at < (now() - interval '12 months');
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_expired_respondent_pii() FROM PUBLIC, anon, authenticated;

-- Cron 03:35 UTC daily (offset from purge_unused_test_sets/attempts
-- to avoid concurrent locks on the same rows).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('purge_expired_respondent_pii_daily')
    WHERE EXISTS (
      SELECT 1 FROM cron.job WHERE jobname = 'purge_expired_respondent_pii_daily'
    );
    PERFORM cron.schedule(
      'purge_expired_respondent_pii_daily',
      '35 3 * * *',
      'SELECT public.purge_expired_respondent_pii();'
    );
  END IF;
END $$;

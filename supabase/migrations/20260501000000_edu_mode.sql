-- E12.1 — Education mode schema (autori zbierajú odpovede študentov).
--
-- Pridáva PII k `attempts` (meno + email respondenta) keď je test_set
-- v edu móde (`collects_responses = true`). RLS striktne oddeľuje:
--   * non-edu rows (respondent_name IS NULL): anon môže SELECT (existing
--     /r/$shareId share-link flow zostáva nezmenený).
--   * edu rows (respondent_name IS NOT NULL): anon NEMÔŽE SELECT vôbec.
--     Autor pristupuje cez password-verified dashboard (E12.4) so
--     service-role tokenom z CF Pages Function.
--
-- Heslo autora je bcrypt cez pgcrypto crypt(...,gen_salt('bf',10)).
-- Verifikácia v RPC `verify_test_set_password` (SECURITY DEFINER, brute
-- force protekcia v rate-limiteri E12.4 CF Function — nie tu).
--
-- Retencia: 12 mesiacov. Po expirácii `purge_expired_respondent_pii`
-- nullify-uje meno + email, ale skóre + answers ostávajú pre štatistiky
-- autora.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. attempts: pridať respondent_* + check constraints.
ALTER TABLE public.attempts
  ADD COLUMN IF NOT EXISTS respondent_name TEXT,
  ADD COLUMN IF NOT EXISTS respondent_email TEXT;

-- Drop pre re-runnability (migration môže byť spustená opakovane v dev).
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

-- 2. RLS — zúžiť anon SELECT len na non-edu rows.
DROP POLICY IF EXISTS "Anyone can read attempts" ON public.attempts;

CREATE POLICY "Anon read non-edu attempts"
  ON public.attempts FOR SELECT
  TO anon, authenticated
  USING (respondent_name IS NULL);

-- 3. Defense-in-depth: public view ktorá vyhadzuje respondent_* stĺpce.
-- Klienti čo chcú agregáty môžu čítať z `attempts_anon` namiesto attempts.
-- Aj keby anon SELECT politika niekedy povolila edu row, view ich nezobrazí.
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

-- 4. Aktualizovať immutability trigger: `respondent_*` po INSERT zamknuté.
-- Autor nesmie meniť meno respondenta a respondent nesmie meniť svoje skóre.
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
     -- Edu PII smie zmeniť IBA na NULL (anonymizácia po retencii). Nikdy
     -- z NULL na hodnotu (zabraňuje retroactive PII injection do starých rows).
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

-- 5. RPC pre hash + verify hesla autora (bcrypt cez pgcrypto bf).
-- Hashovanie hesla beží na strane Postgresu — CF Pages Function (E12.2)
-- volá `hash_test_set_password` cez service role pri vytváraní test_setu.
-- Verifikácia v `verify_test_set_password` je verejná pre anon (s rate
-- limitom v E12.4 CF Function — 5 pokusov / 15 min / IP / set_id).

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
-- service_role má EXECUTE cez default; CF Function používa service-role token.

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

-- 6. Retention — 12-mes. anonymizácia respondent PII.
-- Skóre a answers ostávajú (nie sú PII bez mena/emailu) — autor stále
-- vidí agregáty po expirácii.
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

-- Cron 03:35 UTC daily (offset od purge_unused_test_sets/attempts aby
-- sa nelockoval súčasne na rovnakých riadkoch).
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

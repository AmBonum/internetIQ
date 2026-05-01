-- ============================================================================
-- INTERNET IQ TEST — Kompletná schéma databázy
-- ============================================================================
-- Použitie: 
-- 1. Vytvor si nový projekt na supabase.com (zadarmo)
-- 2. V Supabase dashboard otvor: SQL Editor -> New query
-- 3. Skopíruj celý obsah tohto súboru a klikni RUN
-- ============================================================================

-- 1) TABUĽKA POKUSOV
CREATE TABLE public.attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  share_id TEXT NOT NULL UNIQUE,
  nickname TEXT,
  final_score INTEGER NOT NULL,
  base_score INTEGER NOT NULL,
  total_penalty INTEGER NOT NULL,
  percentile INTEGER NOT NULL,
  personality TEXT NOT NULL,
  breakdown JSONB NOT NULL,
  insights JSONB NOT NULL DEFAULT '[]'::jsonb,
  stats JSONB NOT NULL,
  flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  answers JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_time_ms INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Demografia (voliteľné, vypĺňa sa po teste)
  age_range TEXT,
  gender TEXT,
  city TEXT,
  country TEXT,
  self_caution SMALLINT,
  survey_completed BOOLEAN NOT NULL DEFAULT false,
  -- Rastový prieskum (E2.1, voliteľné, vypĺňa sa po teste)
  top_fear TEXT,
  has_been_scammed TEXT,
  referral_source TEXT,
  wants_courses BOOLEAN,
  interests TEXT[],
  survey_extras_completed BOOLEAN NOT NULL DEFAULT false
);

-- 2) INDEXY
CREATE INDEX attempts_score_idx ON public.attempts (final_score DESC);
CREATE INDEX attempts_created_idx ON public.attempts (created_at DESC);
CREATE INDEX attempts_share_id_idx ON public.attempts (share_id);
CREATE INDEX idx_attempts_answers ON public.attempts USING gin (answers);

-- 3) CONSTRAINTS (validácia dát)
ALTER TABLE public.attempts
  ADD CONSTRAINT attempts_final_score_range CHECK (final_score BETWEEN 0 AND 100),
  ADD CONSTRAINT attempts_base_score_range CHECK (base_score BETWEEN 0 AND 100),
  ADD CONSTRAINT attempts_percentile_range CHECK (percentile BETWEEN 0 AND 100),
  ADD CONSTRAINT attempts_penalty_nonneg CHECK (total_penalty >= 0),
  ADD CONSTRAINT attempts_time_nonneg CHECK (total_time_ms >= 0 AND total_time_ms < 3600000),
  ADD CONSTRAINT attempts_nickname_len CHECK (nickname IS NULL OR char_length(nickname) BETWEEN 1 AND 40),
  ADD CONSTRAINT attempts_share_id_format CHECK (share_id ~ '^[a-zA-Z0-9]{6,12}$'),
  ADD CONSTRAINT attempts_personality_known CHECK (personality IN (
    'internet_ninja','overconfident_victim','scam_magnet','clickbait_zombie','cautious_but_vulnerable'
  )),
  -- E2.1 — growth survey enums (mirror src/lib/quiz/survey-options.ts)
  ADD CONSTRAINT attempts_top_fear_known CHECK (
    top_fear IS NULL OR top_fear IN
      ('phishing','scam_money','scam_identity','hate','doxxing','nothing')
  ),
  ADD CONSTRAINT attempts_has_been_scammed_known CHECK (
    has_been_scammed IS NULL OR has_been_scammed IN
      ('yes_money','yes_data','yes_account','no','prefer_not_to_say')
  ),
  ADD CONSTRAINT attempts_referral_source_known CHECK (
    referral_source IS NULL OR referral_source IN
      ('tiktok','instagram','facebook','friend','google','other')
  ),
  ADD CONSTRAINT attempts_interests_size CHECK (
    interests IS NULL
      OR array_length(interests, 1) IS NULL
      OR array_length(interests, 1) <= 10
  );

-- 4) ROW-LEVEL SECURITY
ALTER TABLE public.attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert attempts"
  ON public.attempts FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read attempts"
  ON public.attempts FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can update demographics"
  ON public.attempts FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- 5) VALIDAČNÝ TRIGGER pre demografické polia
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
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_attempt_demographics_trg
BEFORE INSERT OR UPDATE ON public.attempts
FOR EACH ROW EXECUTE FUNCTION public.validate_attempt_demographics();

-- 6) BEZPEČNOSTNÝ TRIGGER — chráni skóre proti prepisu
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

CREATE TRIGGER forbid_attempt_score_changes_trg
BEFORE UPDATE ON public.attempts
FOR EACH ROW EXECUTE FUNCTION public.forbid_attempt_score_changes();

-- ============================================================================
-- Self-service delete + 36-month retention (matches privacy policy)
-- ============================================================================

DROP POLICY IF EXISTS attempts_anon_delete ON public.attempts;
CREATE POLICY attempts_anon_delete
  ON public.attempts
  FOR DELETE
  TO anon
  USING (share_id IS NOT NULL);

CREATE OR REPLACE FUNCTION public.purge_expired_attempts()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  purged_count integer;
BEGIN
  WITH deleted AS (
    DELETE FROM public.attempts
    WHERE created_at < (now() - interval '36 months')
    RETURNING 1
  )
  SELECT count(*) INTO purged_count FROM deleted;
  RETURN purged_count;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_expired_attempts() FROM anon, authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('purge_expired_attempts_daily')
    WHERE EXISTS (
      SELECT 1 FROM cron.job WHERE jobname = 'purge_expired_attempts_daily'
    );
    PERFORM cron.schedule(
      'purge_expired_attempts_daily',
      '17 3 * * *',
      'SELECT public.purge_expired_attempts();'
    );
  END IF;
END $$;

-- ============================================================================
-- E10.2 — Sponsorship schema (sponsors, donations, subscriptions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_customer_id TEXT UNIQUE NOT NULL,
  display_name TEXT,
  display_link TEXT,
  display_message TEXT,
  show_in_footer BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  total_eur NUMERIC(10, 2) NOT NULL DEFAULT 0,
  CONSTRAINT sponsors_display_link_https CHECK (
    display_link IS NULL OR display_link LIKE 'https://%'
  ),
  CONSTRAINT sponsors_display_message_len CHECK (
    display_message IS NULL OR length(display_message) <= 80
  )
);
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS sponsors_stripe_customer_id_idx
  ON public.sponsors (stripe_customer_id);

CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID NOT NULL REFERENCES public.sponsors(id) ON DELETE RESTRICT,
  stripe_payment_intent_id TEXT UNIQUE,
  amount_eur NUMERIC(10, 2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'EUR',
  kind TEXT NOT NULL CHECK (kind IN ('oneoff', 'subscription_invoice', 'refund')),
  refund_of_donation_id UUID REFERENCES public.donations(id) ON DELETE RESTRICT,
  invoice_pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT donations_refund_consistency CHECK (
    (kind = 'refund' AND refund_of_donation_id IS NOT NULL AND amount_eur < 0)
    OR (kind <> 'refund' AND refund_of_donation_id IS NULL AND amount_eur > 0)
  )
);
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS donations_sponsor_id_idx ON public.donations (sponsor_id);
CREATE INDEX IF NOT EXISTS donations_created_at_idx ON public.donations (created_at DESC);

CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sponsor_id UUID NOT NULL REFERENCES public.sponsors(id) ON DELETE RESTRICT,
  stripe_subscription_id TEXT UNIQUE,
  status TEXT NOT NULL,
  monthly_eur NUMERIC(10, 2) NOT NULL CHECK (monthly_eur > 0),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  cancelled_at TIMESTAMPTZ
);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS subscriptions_sponsor_id_idx ON public.subscriptions (sponsor_id);
CREATE INDEX IF NOT EXISTS subscriptions_active_idx
  ON public.subscriptions (sponsor_id) WHERE cancelled_at IS NULL;

CREATE OR REPLACE FUNCTION public.update_sponsor_total()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.sponsors SET total_eur = total_eur + NEW.amount_eur WHERE id = NEW.sponsor_id;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS donations_update_sponsor_total ON public.donations;
CREATE TRIGGER donations_update_sponsor_total AFTER INSERT ON public.donations
FOR EACH ROW EXECUTE FUNCTION public.update_sponsor_total();
REVOKE ALL ON FUNCTION public.update_sponsor_total() FROM anon, authenticated;

DROP VIEW IF EXISTS public.public_sponsors;
CREATE VIEW public.public_sponsors AS
SELECT id, display_name, display_link, display_message, created_at
FROM public.sponsors WHERE display_name IS NOT NULL;
GRANT SELECT ON public.public_sponsors TO anon, authenticated;

DROP VIEW IF EXISTS public.footer_sponsors;
CREATE VIEW public.footer_sponsors AS
SELECT DISTINCT s.id, s.display_name, s.display_link, s.created_at
FROM public.sponsors s
LEFT JOIN public.subscriptions sub ON sub.sponsor_id = s.id AND sub.cancelled_at IS NULL
WHERE s.show_in_footer = true AND s.display_name IS NOT NULL
  AND (s.total_eur >= 50 OR sub.monthly_eur >= 25);
GRANT SELECT ON public.footer_sponsors TO anon, authenticated;

-- ============================================================================
-- E8.1 — test_sets table for the Composer (E8 epic).
-- Question CONTENT lives in src/lib/quiz/questions.ts (TS bundle); this
-- table only stores the SELECTION (question_ids[]) + threshold + max.
-- Forward-compat: author_password_hash + collects_responses NULL/false
-- so E12 (education mode) can land without another migration round.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.test_sets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_ids TEXT[] NOT NULL,
  passing_threshold INT2 NOT NULL DEFAULT 70,
  max_questions INT2 NOT NULL,
  creator_label TEXT,
  source_pack_slugs TEXT[],
  author_password_hash TEXT,
  collects_responses BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT test_sets_size_chk CHECK (array_length(question_ids, 1) BETWEEN 5 AND 50),
  CONSTRAINT test_sets_threshold_chk CHECK (passing_threshold BETWEEN 50 AND 90),
  CONSTRAINT test_sets_max_consistent CHECK (max_questions = array_length(question_ids, 1)),
  CONSTRAINT test_sets_label_len CHECK (creator_label IS NULL OR length(creator_label) <= 80),
  CONSTRAINT test_sets_pwd_required_when_collecting CHECK (
    collects_responses = false OR author_password_hash IS NOT NULL
  )
  -- Per-element question_id length cap (64 chars) is enforced via the
  -- trigger below — CHECK constraints cannot contain subqueries.
);

CREATE OR REPLACE FUNCTION public.check_test_sets_question_id_len()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM unnest(NEW.question_ids) AS q WHERE length(q) > 64) THEN
    RAISE EXCEPTION 'question_ids elements must be at most 64 characters';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS test_sets_question_id_len_trg ON public.test_sets;
CREATE TRIGGER test_sets_question_id_len_trg
  BEFORE INSERT OR UPDATE ON public.test_sets
  FOR EACH ROW EXECUTE FUNCTION public.check_test_sets_question_id_len();

CREATE INDEX IF NOT EXISTS test_sets_created_at_idx ON public.test_sets (created_at DESC);

ALTER TABLE public.test_sets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS test_sets_anon_select ON public.test_sets;
CREATE POLICY test_sets_anon_select ON public.test_sets FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS test_sets_anon_insert ON public.test_sets;
CREATE POLICY test_sets_anon_insert ON public.test_sets FOR INSERT TO anon WITH CHECK (true);

ALTER TABLE public.attempts
  ADD COLUMN IF NOT EXISTS test_set_id UUID REFERENCES public.test_sets(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS attempts_test_set_id_idx
  ON public.attempts (test_set_id) WHERE test_set_id IS NOT NULL;

-- Extend immutability trigger so test_set_id is locked once an attempt is INSERTed.
CREATE OR REPLACE FUNCTION public.forbid_attempt_score_changes()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
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

CREATE OR REPLACE FUNCTION public.purge_unused_test_sets()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE purged_count integer;
BEGIN
  UPDATE public.attempts SET test_set_id = NULL
  WHERE test_set_id IN (
    SELECT id FROM public.test_sets WHERE created_at < (now() - interval '12 months')
  );
  WITH deleted AS (
    DELETE FROM public.test_sets WHERE created_at < (now() - interval '12 months')
    RETURNING 1
  )
  SELECT count(*) INTO purged_count FROM deleted;
  RETURN purged_count;
END;
$$;

REVOKE ALL ON FUNCTION public.purge_unused_test_sets() FROM anon, authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('purge_unused_test_sets_daily')
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge_unused_test_sets_daily');
    PERFORM cron.schedule(
      'purge_unused_test_sets_daily', '23 3 * * *',
      'SELECT public.purge_unused_test_sets();'
    );
  END IF;
END $$;

-- ============================================================================
-- E12.1 — Education mode (autori zbierajú odpovede študentov, opt-in PII).
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.attempts
  ADD COLUMN IF NOT EXISTS respondent_name TEXT,
  ADD COLUMN IF NOT EXISTS respondent_email TEXT;

ALTER TABLE public.attempts DROP CONSTRAINT IF EXISTS attempts_respondent_email_format;
ALTER TABLE public.attempts ADD CONSTRAINT attempts_respondent_email_format CHECK (
  respondent_email IS NULL OR respondent_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
);
ALTER TABLE public.attempts DROP CONSTRAINT IF EXISTS attempts_edu_pii_pair;
ALTER TABLE public.attempts ADD CONSTRAINT attempts_edu_pii_pair CHECK (
  (respondent_name IS NULL AND respondent_email IS NULL)
  OR (respondent_name IS NOT NULL AND respondent_email IS NOT NULL)
);
ALTER TABLE public.attempts DROP CONSTRAINT IF EXISTS attempts_respondent_name_len;
ALTER TABLE public.attempts ADD CONSTRAINT attempts_respondent_name_len CHECK (
  respondent_name IS NULL OR length(respondent_name) BETWEEN 1 AND 120
);

CREATE INDEX IF NOT EXISTS attempts_test_set_id_created_at_idx
  ON public.attempts (test_set_id, created_at DESC)
  WHERE test_set_id IS NOT NULL;

DROP POLICY IF EXISTS "Anyone can read attempts" ON public.attempts;
CREATE POLICY "Anon read non-edu attempts"
  ON public.attempts FOR SELECT TO anon, authenticated
  USING (respondent_name IS NULL);

CREATE OR REPLACE VIEW public.attempts_anon
WITH (security_invoker = true) AS
SELECT id, share_id, nickname, final_score, base_score, total_penalty, percentile,
       personality, breakdown, insights, stats, flags, total_time_ms,
       test_set_id, created_at
FROM public.attempts
WHERE respondent_name IS NULL;

GRANT SELECT ON public.attempts_anon TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.forbid_attempt_score_changes()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
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

CREATE OR REPLACE FUNCTION public.hash_test_set_password(password TEXT)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER
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

CREATE OR REPLACE FUNCTION public.verify_test_set_password(set_id UUID, password TEXT)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE stored_hash TEXT;
BEGIN
  IF set_id IS NULL OR password IS NULL THEN RETURN false; END IF;
  SELECT author_password_hash INTO stored_hash FROM public.test_sets WHERE id = set_id;
  IF stored_hash IS NULL THEN RETURN false; END IF;
  RETURN crypt(password, stored_hash) = stored_hash;
END;
$$;
GRANT EXECUTE ON FUNCTION public.verify_test_set_password(UUID, TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.purge_expired_respondent_pii()
RETURNS integer LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE affected integer;
BEGIN
  UPDATE public.attempts
  SET respondent_name = NULL, respondent_email = NULL
  WHERE respondent_name IS NOT NULL
    AND created_at < (now() - interval '12 months');
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;
REVOKE ALL ON FUNCTION public.purge_expired_respondent_pii() FROM PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('purge_expired_respondent_pii_daily')
    WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'purge_expired_respondent_pii_daily');
    PERFORM cron.schedule(
      'purge_expired_respondent_pii_daily', '35 3 * * *',
      'SELECT public.purge_expired_respondent_pii();'
    );
  END IF;
END $$;

-- ============================================================================
-- HOTOVO!
-- Teraz choď do Settings -> API a skopíruj si:
--   - Project URL  (napr. https://abcdef.supabase.co)
--   - anon public key
-- Tieto použiješ v Cloudflare Pages ako environment variables.
-- ============================================================================

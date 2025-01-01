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
-- HOTOVO! 
-- Teraz choď do Settings -> API a skopíruj si:
--   - Project URL  (napr. https://abcdef.supabase.co)
--   - anon public key
-- Tieto použiješ v Cloudflare Pages ako environment variables.
-- ============================================================================

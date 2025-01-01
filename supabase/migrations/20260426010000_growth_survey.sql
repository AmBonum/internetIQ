-- E2.1 — Growth survey fields. Optional, user-consented post-test inputs
-- that help us understand audience demographics and interest signals so we
-- can prioritise course topics. All columns are nullable; the existing
-- `Anyone can update demographics` RLS policy already permits anonymous
-- writes via /r/$shareId.
--
-- CHECK constraint values mirror src/lib/quiz/survey-options.ts — drift
-- between the two is the single biggest risk and is enforced by
-- tests/db/attempts-schema.test.ts.

ALTER TABLE public.attempts
  ADD COLUMN IF NOT EXISTS top_fear TEXT NULL,
  ADD COLUMN IF NOT EXISTS has_been_scammed TEXT NULL,
  ADD COLUMN IF NOT EXISTS referral_source TEXT NULL,
  ADD COLUMN IF NOT EXISTS wants_courses BOOLEAN NULL,
  ADD COLUMN IF NOT EXISTS interests TEXT[] NULL,
  ADD COLUMN IF NOT EXISTS survey_extras_completed BOOLEAN NOT NULL DEFAULT false;

-- Idempotent CHECK constraint adds. Postgres doesn't support
-- `ADD CONSTRAINT IF NOT EXISTS`, so guard each one in a DO block.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'attempts_top_fear_known'
  ) THEN
    ALTER TABLE public.attempts
      ADD CONSTRAINT attempts_top_fear_known CHECK (
        top_fear IS NULL OR top_fear IN
          ('phishing','scam_money','scam_identity','hate','doxxing','nothing')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'attempts_has_been_scammed_known'
  ) THEN
    ALTER TABLE public.attempts
      ADD CONSTRAINT attempts_has_been_scammed_known CHECK (
        has_been_scammed IS NULL OR has_been_scammed IN
          ('yes_money','yes_data','yes_account','no','prefer_not_to_say')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'attempts_referral_source_known'
  ) THEN
    ALTER TABLE public.attempts
      ADD CONSTRAINT attempts_referral_source_known CHECK (
        referral_source IS NULL OR referral_source IN
          ('tiktok','instagram','facebook','friend','google','other')
      );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'attempts_interests_size'
  ) THEN
    ALTER TABLE public.attempts
      ADD CONSTRAINT attempts_interests_size CHECK (
        interests IS NULL
          OR array_length(interests, 1) IS NULL
          OR array_length(interests, 1) <= 10
      );
  END IF;
END $$;

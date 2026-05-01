-- E12.3 + E12.7 — lock down anon INSERT path for edu attempts.
--
-- The existing RLS policy "Anyone can insert attempts" allows the anon
-- client to INSERT anything (including PII rows with respondent_*).
-- After E12.1 anon cannot SELECT edu rows, but it could still INSERT
-- them directly via the Supabase anon key, bypassing the intake form,
-- honeypot and rate-limit in `/api/begin-edu-attempt`.
--
-- Fix: anon may INSERT only non-edu rows (respondent_name +
-- respondent_email NULL). Edu rows are written exclusively by
-- `/api/finish-edu-attempt` CF Pages Function via the service-role key
-- (RLS bypass).

DROP POLICY IF EXISTS "Anyone can insert attempts" ON public.attempts;

CREATE POLICY "Anon insert non-edu attempts only"
  ON public.attempts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (respondent_name IS NULL AND respondent_email IS NULL);

-- The self-service delete policy from
-- `20260426110000_self_service_delete_and_retention` remains in effect
-- for non-edu attempts; edu rows cannot be deleted by the respondent
-- (collection is the author's responsibility). The author manages
-- respondent deletion via the password-protected dashboard (E12.4)
-- using the service-role key.

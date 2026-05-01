-- E12.3 + E12.7 — lock down anon INSERT path for edu attempts.
--
-- Existujúca RLS politika "Anyone can insert attempts" povoľuje anon
-- klientovi INSERT-núť čokoľvek (vrátane PII riadkov s respondent_*).
-- Po E12.1 anon nedokáže edu rows SELECT-núť, ale stále by ich mohol
-- INSERT-núť priamo cez Supabase anon kľúč a obísť tak intake formulár,
-- honeypot a rate-limit v `/api/begin-edu-attempt`.
--
-- Riešenie: anon má povolený INSERT iba pre non-edu rows
-- (respondent_name + respondent_email NULL). Edu rows zapisuje výlučne
-- `/api/finish-edu-attempt` CF Pages Function cez service-role kľúč
-- (RLS bypass).

DROP POLICY IF EXISTS "Anyone can insert attempts" ON public.attempts;

CREATE POLICY "Anon insert non-edu attempts only"
  ON public.attempts
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (respondent_name IS NULL AND respondent_email IS NULL);

-- Self-service delete politika z `20260426110000_self_service_delete_and_retention`
-- ostáva v platnosti pre non-edu attempts; edu rows respondent nemôže
-- vymazať (zber je v réžii autora). Autor mazanie respondentov rieši
-- cez password-protected dashboard (E12.4) cez service-role.

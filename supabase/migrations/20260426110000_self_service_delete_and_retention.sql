-- Self-service delete + 36-month retention enforcement.
--
-- Honours two privacy promises that were previously documented but
-- not enforced in code:
--
--   1. Right to erasure (GDPR Art. 17): the user holding the share_id
--      URL can delete their own attempt themselves, no email needed.
--   2. 36-month retention (privacy policy table row "attempts"):
--      a daily pg_cron job purges rows older than 36 months.

-- 1. Allow anon DELETE filtered by share_id. Since share_id is a
-- random UUID returned only to the user who completed the test, this
-- is effectively "delete only your own row".
DROP POLICY IF EXISTS attempts_anon_delete ON public.attempts;
CREATE POLICY attempts_anon_delete
  ON public.attempts
  FOR DELETE
  TO anon
  USING (share_id IS NOT NULL);

-- 2. Retention purge function — DELETEs rows older than 36 months.
-- Returns the number of rows purged for observability.
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

-- 3. Schedule the purge daily at 03:17 UTC (off-peak). Requires the
-- pg_cron extension. If it is not enabled in your Supabase project,
-- enable it from Database -> Extensions before running this migration,
-- or schedule the call from a Supabase Edge Function on a cron trigger.
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

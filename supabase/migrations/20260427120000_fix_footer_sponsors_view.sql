-- E11.4.2 — Recreate footer_sponsors view cleanly.
--
-- The original CREATE VIEW from 20260427000000_sponsors.sql arrived in the
-- Supabase SQL editor with markdown auto-link garbage injected by the editor
-- (e.g. [s.id](http://s.id) instead of s.id) — Postgres accepted the array-
-- literal interpretation but the resulting view is syntactically wrong and
-- never returns rows. This migration drops + recreates with clean SQL.
--
-- Tier rule: sponsor must opt in (show_in_footer = true) AND be publicly
-- named (display_name IS NOT NULL) AND meet at least one tier threshold:
--   - one-off cumulative ≥ 50 EUR (sponsors.total_eur)
--   - active monthly ≥ 25 EUR/mes (subscriptions.monthly_eur on a row
--     where cancelled_at IS NULL)

DROP VIEW IF EXISTS public.footer_sponsors;

CREATE VIEW public.footer_sponsors AS
SELECT DISTINCT
  s.id,
  s.display_name,
  s.display_link,
  s.created_at
FROM public.sponsors s
LEFT JOIN public.subscriptions sub
  ON sub.sponsor_id = s.id
  AND sub.cancelled_at IS NULL
WHERE s.show_in_footer = true
  AND s.display_name IS NOT NULL
  AND (s.total_eur >= 50 OR sub.monthly_eur >= 25);

GRANT SELECT ON public.footer_sponsors TO anon, authenticated;

COMMENT ON VIEW public.footer_sponsors IS
  'E11.4 sponsorship — tier-gated subset for SiteFooter (opt-in display_name + (total_eur ≥ 50 OR active monthly_eur ≥ 25)).';

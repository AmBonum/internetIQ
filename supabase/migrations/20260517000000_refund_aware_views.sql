-- ============================================================================
-- 20260517000000 — refund-aware public_sponsors view (E10 follow-up)
-- ============================================================================
-- After the first real €5 donation was refunded by the contributor, the
-- /sponzori page should reflect the refund with a visible "Vrátené" badge
-- (transparency principle).
--
-- Data model is unchanged: stripe-webhook charge.refunded handler already
-- inserts a row with `kind='refund'`, negative `amount_eur`, and
-- `refund_of_donation_id` FK. The `donations_update_sponsor_total` trigger
-- (see 20260427000000_sponsors.sql) already decrements `sponsors.total_eur`
-- on refund insert, so the footer's `total_eur >= 50` filter automatically
-- excludes fully-refunded sponsors — no change to footer_sponsors needed.
--
-- This migration only extends `public_sponsors` to expose:
--   - net_amount_eur: alias of sponsors.total_eur for UI consumption
--   - has_refund:     EXISTS over donations.kind='refund' for the badge
-- ============================================================================

DROP VIEW IF EXISTS public.public_sponsors;
CREATE VIEW public.public_sponsors AS
SELECT
  s.id,
  s.display_name,
  s.display_link,
  s.display_message,
  s.created_at,
  s.total_eur AS net_amount_eur,
  EXISTS (
    SELECT 1 FROM public.donations d
    WHERE d.sponsor_id = s.id AND d.kind = 'refund'
  ) AS has_refund
FROM public.sponsors s
WHERE s.display_name IS NOT NULL;

GRANT SELECT ON public.public_sponsors TO anon, authenticated;

COMMENT ON VIEW public.public_sponsors IS
  'E10.2 sponsorship — anon-readable subset with opt-in display_* fields. Exposes net_amount_eur (alias for sponsors.total_eur) and has_refund so /sponzori can render a "Vrátené" badge for refunded sponsors.';

-- E10.2 — Sponsorship schema (sponsors, donations, subscriptions).
--
-- Honours decisions from tasks/E10-sponsorship-decisions.md:
--   - ON DELETE RESTRICT (not CASCADE) so 10-year accounting retention
--     per zákon č. 431/2002 Z. z. wins over GDPR Art. 17 cascade
--     (erasure is implemented as anonymization in E11.5 runbook).
--   - donations.kind includes 'refund'; webhook (E10.3) inserts a row
--     with negative amount_eur, trigger decrements sponsors.total_eur.
--   - public_sponsors view exposes only opt-in display_* fields, never
--     total_eur or stripe_customer_id (PII).
--   - footer_sponsors view applies the tier rule (total_eur >= 50 OR
--     active monthly_eur >= 25) for SiteFooter render gating.
--
-- All three private tables: RLS enabled, NO anon policies. The webhook
-- (E10.3) uses the service role key from Cloudflare Pages env, so it
-- bypasses RLS by design.

-- ============================================================================
-- 1. sponsors
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

-- ============================================================================
-- 2. donations  (10-year retention; refunds = negative amount rows)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- ON DELETE RESTRICT: legal obligation to keep accounting records
  -- 10 years per zákon č. 431/2002 Z. z. — sponsor cannot be DELETEd
  -- while donations exist. GDPR Art. 17 is handled via anonymization.
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

CREATE INDEX IF NOT EXISTS donations_sponsor_id_idx
  ON public.donations (sponsor_id);
CREATE INDEX IF NOT EXISTS donations_created_at_idx
  ON public.donations (created_at DESC);

-- ============================================================================
-- 3. subscriptions  (10-year retention after cancelled_at)
-- ============================================================================
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

CREATE INDEX IF NOT EXISTS subscriptions_sponsor_id_idx
  ON public.subscriptions (sponsor_id);
CREATE INDEX IF NOT EXISTS subscriptions_active_idx
  ON public.subscriptions (sponsor_id) WHERE cancelled_at IS NULL;

-- ============================================================================
-- 4. update_sponsor_total trigger — keeps sponsors.total_eur in sync.
--    Refunds are negative amount, so the trigger naturally decrements.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_sponsor_total()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.sponsors
  SET total_eur = total_eur + NEW.amount_eur
  WHERE id = NEW.sponsor_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS donations_update_sponsor_total ON public.donations;
CREATE TRIGGER donations_update_sponsor_total
AFTER INSERT ON public.donations
FOR EACH ROW EXECUTE FUNCTION public.update_sponsor_total();

REVOKE ALL ON FUNCTION public.update_sponsor_total() FROM anon, authenticated;

-- ============================================================================
-- 5. public_sponsors view — anon can SELECT only opt-in display fields.
--    Never exposes total_eur, stripe_customer_id, or any other PII.
-- ============================================================================
DROP VIEW IF EXISTS public.public_sponsors;
CREATE VIEW public.public_sponsors AS
SELECT
  id,
  display_name,
  display_link,
  display_message,
  created_at
FROM public.sponsors
WHERE display_name IS NOT NULL;

GRANT SELECT ON public.public_sponsors TO anon, authenticated;

-- ============================================================================
-- 6. footer_sponsors view — tier-gated (≥50 EUR oneoff cumulatively
--    OR ≥25 EUR active monthly). Anon SELECT for site footer render.
-- ============================================================================
DROP VIEW IF EXISTS public.footer_sponsors;
CREATE VIEW public.footer_sponsors AS
SELECT DISTINCT
  s.id,
  s.display_name,
  s.display_link
FROM public.sponsors s
LEFT JOIN public.subscriptions sub
  ON sub.sponsor_id = s.id AND sub.cancelled_at IS NULL
WHERE s.show_in_footer = true
  AND s.display_name IS NOT NULL
  AND (s.total_eur >= 50 OR sub.monthly_eur >= 25);

GRANT SELECT ON public.footer_sponsors TO anon, authenticated;

-- ============================================================================
-- 7. Author-grade comment trail for grep-ability
-- ============================================================================
COMMENT ON TABLE public.sponsors IS
  'E10.2 sponsorship — top-level donor record. PII; anon access only via public_sponsors view.';
COMMENT ON TABLE public.donations IS
  'E10.2 sponsorship — payment events. 10-year retention per zákon č. 431/2002 Z. z. Refunds = negative amount + refund_of_donation_id self-FK.';
COMMENT ON TABLE public.subscriptions IS
  'E10.2 sponsorship — Stripe Subscriptions mirror. cancelled_at NULL = active.';
COMMENT ON VIEW public.public_sponsors IS
  'E10.2 sponsorship — anon-readable subset of sponsors with opt-in display_* fields.';
COMMENT ON VIEW public.footer_sponsors IS
  'E10.2 sponsorship — tier-gated subset for SiteFooter (≥50 EUR oneoff or ≥25 EUR/mo active).';

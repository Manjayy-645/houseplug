-- No payment amounts or historical entitlements are rewritten.
SET LOCAL lock_timeout='5s';
ALTER TABLE public.payments
 ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES public.service_providers(id),
 ADD COLUMN IF NOT EXISTS fulfilment_status text CHECK(fulfilment_status IN ('processing','failed','fulfilled')),
 ADD COLUMN IF NOT EXISTS fulfilment_anchor_at timestamptz,
 ADD COLUMN IF NOT EXISTS fulfilment_lease_until timestamptz;
ALTER TABLE public.listing_boosts ADD COLUMN IF NOT EXISTS amount integer;
-- Fail rather than deleting any historical duplicate boost records.
CREATE UNIQUE INDEX IF NOT EXISTS listing_boosts_payment_reference ON public.listing_boosts(paystack_reference);
CREATE OR REPLACE FUNCTION public.claim_payment_fulfilment(payment_reference text)
RETURNS timestamptz LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE anchor timestamptz;
BEGIN
 UPDATE public.payments SET fulfilment_status='processing',fulfilment_anchor_at=coalesce(fulfilment_anchor_at,now()),fulfilment_lease_until=now()+interval '5 minutes'
 WHERE paystack_reference=payment_reference
 AND (status<>'success' OR fulfilment_status IS NOT NULL)
 AND (fulfilment_status IS NULL OR fulfilment_status='failed' OR (fulfilment_status='processing' AND fulfilment_lease_until<now()))
 RETURNING fulfilment_anchor_at INTO anchor;
 RETURN anchor;
END $$;
REVOKE ALL ON FUNCTION public.claim_payment_fulfilment(text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_payment_fulfilment(text) TO service_role;
NOTIFY pgrst,'reload schema';

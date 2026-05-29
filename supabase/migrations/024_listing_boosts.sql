-- 024_listing_boosts.sql
-- Boost feature schema. The app code (lib/billing.ts, browse sort, listing
-- card badges, types/index.ts) already references these, but no migration
-- ever created them — so paid boosts threw on insert and were never applied.
-- Everything here is idempotent and safe to run on an existing database.

-- 1. Listing columns used by boosts
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS is_urgent BOOLEAN DEFAULT false;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS boost_expires_at TIMESTAMPTZ;

-- 2. listing_boosts table (mirrors the ListingBoost type)
CREATE TABLE IF NOT EXISTS public.listing_boosts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  boost_type TEXT NOT NULL,
  amount INTEGER,
  starts_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  active BOOLEAN DEFAULT true,
  paystack_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_listing_boosts_listing_id ON public.listing_boosts(listing_id);
CREATE INDEX IF NOT EXISTS idx_listing_boosts_landlord_id ON public.listing_boosts(landlord_id);
CREATE INDEX IF NOT EXISTS idx_listing_boosts_active_expires ON public.listing_boosts(active, expires_at);

-- 3. RLS — landlords read their own boosts, admins read all.
-- Inserts happen from billing.ts using the service role, which bypasses RLS,
-- so no INSERT policy is needed (and none is granted, keeping it locked down).
ALTER TABLE public.listing_boosts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Landlords can view own boosts" ON public.listing_boosts;
CREATE POLICY "Landlords can view own boosts"
ON public.listing_boosts FOR SELECT
TO authenticated
USING (auth.uid() = landlord_id OR public.is_admin());

-- 4. Cron to expire boosts (subscription-featured removal lives in 010).
DO $$ BEGIN
  PERFORM cron.unschedule('expire-boosts');
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

SELECT cron.schedule(
  'expire-boosts',
  '15 0 * * *', -- daily, shortly after the subscription job
  $$
    -- Deactivate boost records past their window
    UPDATE public.listing_boosts
    SET active = false
    WHERE active = true AND expires_at IS NOT NULL AND expires_at < now();

    -- Drop the urgent tag once no active urgent boost remains
    UPDATE public.listings l
    SET is_urgent = false
    WHERE is_urgent = true
      AND NOT EXISTS (
        SELECT 1 FROM public.listing_boosts b
        WHERE b.listing_id = l.id
          AND b.boost_type = 'urgent'
          AND b.active = true
          AND (b.expires_at IS NULL OR b.expires_at > now())
      );

    -- Drop the featured flag when the boost window passes, unless the
    -- landlord still has an active subscription keeping it featured.
    UPDATE public.listings l
    SET is_featured = false, boost_expires_at = NULL
    WHERE is_featured = true
      AND l.boost_expires_at IS NOT NULL
      AND l.boost_expires_at < now()
      AND NOT EXISTS (
        SELECT 1 FROM public.listing_boosts b
        WHERE b.listing_id = l.id
          AND b.boost_type IN ('featured_7', 'featured_30')
          AND b.active = true
          AND b.expires_at > now()
      )
      AND l.landlord_id NOT IN (
        SELECT landlord_id FROM public.subscriptions WHERE active = true
      );
  $$
);

-- Enable pg_cron extension if not enabled (Supabase usually has this in the extensions schema)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule subscription expiration
-- This unschedules any existing job with the same name first to avoid duplicates
SELECT cron.unschedule('expire-subscriptions');

SELECT cron.schedule(
  'expire-subscriptions',
  '0 0 * * *', -- Every day at midnight
  $$
    -- 1. Mark subscriptions as inactive if they have reached their expiry date
    UPDATE public.subscriptions
    SET active = false
    WHERE active = true AND expires_at < now();

    -- 2. Remove featured status from listings where the landlord no longer has an active subscription
    -- This ensures that once a plan expires, the "Featured" badge is automatically removed
    UPDATE public.listings
    SET is_featured = false
    WHERE is_featured = true 
      AND landlord_id IN (
        SELECT landlord_id 
        FROM public.subscriptions 
        WHERE active = false
      )
      AND landlord_id NOT IN (
        SELECT landlord_id 
        FROM public.subscriptions 
        WHERE active = true
      );
  $$
);

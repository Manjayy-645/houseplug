-- 025_backfill_unapplied_urgent_boost.sql
-- One-off backfill: a landlord paid for an urgent boost before the boost
-- application bug was fixed, so the listing never received its urgent tag.
-- Apply it manually here. Safe no-op on environments where the row is absent
-- or already urgent.
UPDATE public.listings
SET is_urgent = true,
    boost_expires_at = now() + interval '7 days'
WHERE id = '8ad363e5-cd68-4f95-9d05-d203cb806768'
  AND is_urgent IS DISTINCT FROM true;

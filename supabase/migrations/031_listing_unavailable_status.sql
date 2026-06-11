-- 031_listing_unavailable_status.sql
-- Introduce an 'unavailable' status so landlords/agents can hide a listing
-- (tenant found) without deleting it. Standardise on 'unavailable' — the app
-- previously used an ad-hoc 'inactive' value for the same purpose.

-- Migrate any legacy 'inactive' rows first so the CHECK constraint validates.
UPDATE public.listings SET status = 'unavailable' WHERE status = 'inactive';

ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_status_check;

ALTER TABLE public.listings
  ADD CONSTRAINT listings_status_check
  CHECK (status IN ('pending', 'active', 'rejected', 'unavailable'));

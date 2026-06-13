-- Ensure deleting a profile cascades to all of a user's data, so super-admin
-- user deletion leaves nothing orphaned. Most of these FKs were already created
-- ON DELETE CASCADE in earlier migrations; this re-affirms them idempotently.
--
-- The one that genuinely needed fixing is reviews.student_id — it was created
-- without a cascade, so deleting a student who had written reviews would fail
-- on a foreign-key violation.

-- Listings -> profiles (already cascade; re-affirm)
ALTER TABLE public.listings DROP CONSTRAINT IF EXISTS listings_landlord_id_fkey;
ALTER TABLE public.listings
  ADD CONSTRAINT listings_landlord_id_fkey
  FOREIGN KEY (landlord_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Reviews -> profiles (THE fix: add the missing cascade)
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_student_id_fkey;
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_student_id_fkey
  FOREIGN KEY (student_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Reviews -> listings (already cascade; re-affirm so a deleted user's listings
-- take their reviews with them)
ALTER TABLE public.reviews DROP CONSTRAINT IF EXISTS reviews_listing_id_fkey;
ALTER TABLE public.reviews
  ADD CONSTRAINT reviews_listing_id_fkey
  FOREIGN KEY (listing_id) REFERENCES public.listings(id) ON DELETE CASCADE;

-- Subscriptions -> profiles (already cascade; re-affirm)
ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_landlord_id_fkey;
ALTER TABLE public.subscriptions
  ADD CONSTRAINT subscriptions_landlord_id_fkey
  FOREIGN KEY (landlord_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Payments -> profiles (created in 033; re-affirm)
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_landlord_id_fkey;
ALTER TABLE public.payments
  ADD CONSTRAINT payments_landlord_id_fkey
  FOREIGN KEY (landlord_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Listing boosts -> profiles (already cascade; re-affirm)
ALTER TABLE public.listing_boosts DROP CONSTRAINT IF EXISTS listing_boosts_landlord_id_fkey;
ALTER TABLE public.listing_boosts
  ADD CONSTRAINT listing_boosts_landlord_id_fkey
  FOREIGN KEY (landlord_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

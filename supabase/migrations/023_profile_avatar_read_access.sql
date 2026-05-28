-- 023_profile_avatar_read_access.sql
-- Guarantee that profile rows (including avatar_url) are readable.
--
-- This is defensive / idempotent. As of migration 019 the profiles table
-- already has a `Public profiles are viewable by everyone` SELECT policy
-- (USING true), and migration 022 makes the `avatars` storage bucket public.
-- This migration re-asserts those guarantees so the navbar / landlord cards /
-- review avatars can always read avatar_url, regardless of earlier drift.

-- 1. Make sure RLS is enabled (it should already be).
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Public read of profiles (needed for navbar own-profile read, landlord
--    cards, and review avatars). USING (true) returns every column including
--    avatar_url — RLS controls row visibility, never individual columns, so a
--    permitted row always includes avatar_url.
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- 3. Public read of avatar objects in storage (re-assert from 022).
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

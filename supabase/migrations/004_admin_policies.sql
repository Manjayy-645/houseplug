-- Add comprehensive policies for admins and fix landlord visibility issues

-- Function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 1. Profiles Policies
-- Users can already view and update their own profile (from 001_initial.sql)
DO $$ BEGIN
  CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT TO authenticated USING (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE TO authenticated USING (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. Listings Policies
-- Fix: Landlords should be able to see their own listings regardless of status
DO $$ BEGIN
  CREATE POLICY "Landlords can view own listings" ON public.listings
    FOR SELECT TO authenticated USING (auth.uid() = landlord_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Fix: Admin can view and manage all listings
DO $$ BEGIN
  CREATE POLICY "Admins can do everything on listings" ON public.listings
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3. Reviews Policies
-- Add reply column to reviews if it doesn't exist
DO $$ BEGIN
  ALTER TABLE public.reviews ADD COLUMN IF NOT EXISTS reply TEXT;
EXCEPTION WHEN others THEN NULL; END $$;

-- Anyone can see reviews (already in 001_initial.sql, but let's make it robust)
DO $$ BEGIN
  CREATE POLICY "Public can view reviews" ON public.reviews
    FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Fix: Landlords can view reviews for their own listings
DO $$ BEGIN
  CREATE POLICY "Landlords can view reviews for own listings" ON public.reviews
    FOR SELECT TO authenticated USING (
      EXISTS (
        SELECT 1 FROM public.listings
        WHERE id = public.reviews.listing_id AND landlord_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Fix: Landlords can update their own reviews (specifically for replies)
DO $$ BEGIN
  CREATE POLICY "Landlords can reply to reviews" ON public.reviews
    FOR UPDATE TO authenticated USING (
      EXISTS (
        SELECT 1 FROM public.listings
        WHERE id = public.reviews.listing_id AND landlord_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Fix: Admin can manage all reviews
DO $$ BEGIN
  CREATE POLICY "Admins can do everything on reviews" ON public.reviews
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. Subscriptions Policies
-- Fix: Landlords can view their own subscriptions
DO $$ BEGIN
  CREATE POLICY "Landlords can view own subscriptions" ON public.subscriptions
    FOR SELECT TO authenticated USING (auth.uid() = landlord_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Fix: Admins can view and manage all subscriptions
DO $$ BEGIN
  CREATE POLICY "Admins can do everything on subscriptions" ON public.subscriptions
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

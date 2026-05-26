-- REVOLUTIONARY FIX FOR ADMIN RLS RECURSION
-- Run this in your Supabase SQL Editor

-- 1. Drop existing functions to start fresh
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

-- 2. Create a robust is_admin function that uses SECURITY DEFINER
-- This allows it to bypass RLS when checking the profiles table, avoiding recursion.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
DECLARE
  _role TEXT;
BEGIN
  -- We query auth.uid() directly. 
  -- Since this is SECURITY DEFINER, it runs as the owner (postgres), bypassing RLS on public.profiles.
  SELECT role INTO _role 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  RETURN _role IN ('admin', 'super_admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Update Profiles Policies
-- Ensure we have a clean slate for the profiles table
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Base policy: Users can always see and edit their own row
CREATE POLICY "Users can view own profile" ON public.profiles 
    FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles 
    FOR UPDATE TO authenticated USING (auth.uid() = id);

-- Admin policy: Admins can see and update everything
-- We use a subquery check here to be extra safe about bypass
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT TO authenticated 
    USING (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
    );

CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE TO authenticated 
    USING (
      (SELECT role FROM public.profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
    );

-- 4. Re-verify the Super Admin user
-- Replace with the email you are currently using to log in if different
UPDATE public.profiles 
SET role = 'super_admin' 
WHERE email = 'mezekiel024@uniport.edu.ng';

-- 5. Ensure other tables also use the updated is_admin function
DROP POLICY IF EXISTS "Admins can do everything on listings" ON public.listings;
CREATE POLICY "Admins can do everything on listings" ON public.listings
    FOR ALL TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can do everything on reviews" ON public.reviews;
CREATE POLICY "Admins can do everything on reviews" ON public.reviews
    FOR ALL TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can do everything on subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can do everything on subscriptions" ON public.subscriptions
    FOR ALL TO authenticated USING (public.is_admin());

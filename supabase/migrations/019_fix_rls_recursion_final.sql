-- 019_fix_rls_recursion_final.sql
-- FINAL FIX FOR INFINITE RECURSION

-- 1. Drop existing functions to start fresh
DROP FUNCTION IF EXISTS public.is_admin() CASCADE;

-- 2. Create a SECURITY DEFINER function to check admin status
-- SECURITY DEFINER bypasses RLS, which is necessary to avoid recursion when checking the profiles table.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Clean up ALL old profile policies to prevent conflicts
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are editable by owners or admins" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- 4. Create NEW, Simple, Non-Recursive Policies for Profiles
-- Everyone can read profiles. This breaks the recursion loop completely.
CREATE POLICY "Public profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

-- Users can only edit their own profile, UNLESS they are an admin
CREATE POLICY "Profiles are editable by owners or admins" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id OR public.is_admin());

-- 5. Fix Listings Policy to use the safe check
DROP POLICY IF EXISTS "Anyone can view active listings" ON public.listings;
DROP POLICY IF EXISTS "Admins can do everything on listings" ON public.listings;
DROP POLICY IF EXISTS "Landlords can view own listings" ON public.listings;

CREATE POLICY "Anyone can view active listings" 
ON public.listings FOR SELECT 
USING (status = 'active' OR auth.uid() = landlord_id OR public.is_admin());

CREATE POLICY "Admins can do everything on listings" 
ON public.listings FOR ALL 
TO authenticated 
USING (public.is_admin());

-- 6. Final check: Ensure your user is Super Admin
UPDATE public.profiles 
SET role = 'super_admin' 
WHERE email = 'mezekiel024@uniport.edu.ng';

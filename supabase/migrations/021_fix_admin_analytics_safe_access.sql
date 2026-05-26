-- 021_fix_admin_analytics_safe_access.sql
-- Ensure super_admin can read all profiles even if RLS is partially restrictive

-- 1. Ensure public.is_admin() is strictly SECURITY DEFINER
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

-- 2. Grant explicit select to authenticated admins
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
ON public.profiles FOR SELECT 
TO authenticated 
USING (public.is_admin());

-- 3. Ensure listings also allow admin view regardless of status
DROP POLICY IF EXISTS "Admins can view all listings" ON public.listings;
CREATE POLICY "Admins can view all listings" 
ON public.listings FOR SELECT 
TO authenticated 
USING (public.is_admin());

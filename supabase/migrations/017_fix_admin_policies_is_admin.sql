-- 017_fix_admin_policies_is_admin.sql
-- Comprehensive fix for admin visibility issues across all tables

-- 1. Profiles Table Policies
-- Drop existing admin select policy if it exists
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles
    FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
CREATE POLICY "Admins can update all profiles" ON public.profiles
    FOR UPDATE TO authenticated USING (public.is_admin());

-- 2. Listings Table Policies
DROP POLICY IF EXISTS "Admins can do everything on listings" ON public.listings;
CREATE POLICY "Admins can do everything on listings" ON public.listings
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 3. Reviews Table Policies
DROP POLICY IF EXISTS "Admins can do everything on reviews" ON public.reviews;
CREATE POLICY "Admins can do everything on reviews" ON public.reviews
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 4. Subscriptions Table Policies
DROP POLICY IF EXISTS "Admins can do everything on subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can do everything on subscriptions" ON public.subscriptions
    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 5. Payments Table Policies
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'payments') THEN
    DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
    CREATE POLICY "Admins can view all payments" ON public.payments
      FOR SELECT TO authenticated USING (public.is_admin());
      
    DROP POLICY IF EXISTS "Admins can manage all payments" ON public.payments;
    CREATE POLICY "Admins can manage all payments" ON public.payments
      FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;
END $$;

-- 6. Storage Bucket Policies (Verifications)
-- We need to ensure super_admins can also see the docs
DO $$
BEGIN
  -- First, find and delete the old restrictive policy
  DELETE FROM storage.policies 
  WHERE bucket_id = 'verifications' AND name = 'Admins can view all verification docs';

  -- Add the new policy using is_admin() function
  -- Note: storage.policies uses a different check mechanism, we usually have to check the profiles table manually
  INSERT INTO storage.policies (name, bucket_id, operation, definition)
  VALUES ('Admins can view all verification docs', 'verifications', 'SELECT', 
    '(role() = ''authenticated'') AND (bucket_id = ''verifications'') AND (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND (role = ''admin'' OR role = ''super_admin'')))');

EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Storage policies update skipped or failed: %', SQLERRM;
END $$;

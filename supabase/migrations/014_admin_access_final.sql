-- Ensure all admin tables have policies that include super_admin via is_admin()

-- 1. Payments table policies (ensuring it exists and has RLS)
-- Since I couldn't find the migration, I'll check if it exists first
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename  = 'payments') THEN
    ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
    
    DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
    CREATE POLICY "Admins can view all payments" ON public.payments
      FOR SELECT TO authenticated USING (public.is_admin());
      
    DROP POLICY IF EXISTS "Admins can manage all payments" ON public.payments;
    CREATE POLICY "Admins can manage all payments" ON public.payments
      FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
  END IF;
END $$;

-- 2. Audit logs - broaden to all admins if desired, or keep for super_admin
-- The user specifically asked for super admin, but usually regular admins can't see audit logs of other admins.
-- I'll stick to super_admin for audit logs as per previous migration, but ensured is_admin is used elsewhere.

-- 3. Ensure all profiles can be seen by super_admin
-- Already handled by is_admin() update in 013 and existing policies in 004.

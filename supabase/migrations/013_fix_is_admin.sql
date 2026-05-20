-- Update is_admin function to include super_admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Ensure audit_logs policy includes super_admin (already done in 011 but let's be sure)
-- platform_settings policy also already done.

-- Add policy for admins to delete listings if not already covered by 'everything'
-- The existing policy was:
-- CREATE POLICY "Admins can do everything on listings" ON public.listings
--    FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
-- Since public.is_admin() now includes super_admin, this should work.

-- Consolidated SQL Setup for Super Admin & Marketing Card Features
-- Run this in the Supabase SQL Editor (houseplug.ng)

-- 1. EXTEND ROLES & PERMISSIONS
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

-- 2. UPDATE SUPER ADMIN USER
UPDATE profiles 
SET role = 'super_admin' 
WHERE email = 'mezekiel024@uniport.edu.ng';

-- 3. AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can read audit logs"
  ON audit_logs FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  );

-- 4. PLATFORM SETTINGS TABLE
CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

-- Insert default settings
INSERT INTO platform_settings (key, value) VALUES
  ('maintenance_mode', 'false'),
  ('pro_plan_price', '500000'),
  ('business_plan_price', '1500000'),
  ('verification_fee', '200000'),
  ('boost_featured_7', '150000'),
  ('boost_featured_30', '400000'),
  ('boost_urgent', '50000'),
  ('boost_refresh', '30000'),
  ('max_free_listings', '1'),
  ('max_pro_listings', '5')
ON CONFLICT (key) DO NOTHING;

CREATE POLICY "Anyone can read platform settings"
  ON platform_settings FOR SELECT
  USING (true);

CREATE POLICY "Only super admin can update settings"
  ON platform_settings FOR UPDATE
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  );

-- 5. LANDLORD USERNAMES
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

CREATE OR REPLACE FUNCTION generate_username(full_name TEXT)
RETURNS TEXT AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  base_username := lower(
    regexp_replace(
      regexp_replace(full_name, '[^a-zA-Z0-9\s]', '', 'g'),
      '\s+', '-', 'g'
    )
  );
  final_username := base_username;
  WHILE EXISTS (
    SELECT 1 FROM profiles WHERE username = final_username
  ) LOOP
    counter := counter + 1;
    final_username := base_username || '-' || counter;
  END LOOP;
  RETURN final_username;
END;
$$ LANGUAGE plpgsql;

-- Backfill usernames for existing landlords/admins
UPDATE profiles
SET username = generate_username(full_name)
WHERE username IS NULL
AND role IN ('landlord', 'admin', 'super_admin');

-- 6. PAYMENTS TABLE PERMISSIONS
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

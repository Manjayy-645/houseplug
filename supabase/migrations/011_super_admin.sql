-- Update existing user to super_admin
UPDATE profiles 
SET role = 'super_admin' 
WHERE email = 'mezekiel024@uniport.edu.ng';

-- Audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Platform settings table
CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_by UUID REFERENCES profiles(id),
  updated_at TIMESTAMPTZ DEFAULT now()
);

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

ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can read audit logs"
  ON audit_logs FOR SELECT
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) 
    IN ('super_admin')
  );

CREATE POLICY "Anyone can read platform settings"
  ON platform_settings FOR SELECT
  USING (true);

CREATE POLICY "Only super admin can update settings"
  ON platform_settings FOR UPDATE
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'super_admin'
  );

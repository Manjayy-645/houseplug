-- Migration: Admin full access to roommate profiles

CREATE POLICY "Admins have full access to roommate_profiles"
  ON roommate_profiles FOR ALL
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) IN ('admin', 'super_admin')
  );

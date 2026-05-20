ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;

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

UPDATE profiles
SET username = generate_username(full_name)
WHERE username IS NULL
AND role IN ('landlord', 'admin', 'super_admin');

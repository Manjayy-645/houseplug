-- Add a foreign key from roommate_profiles.user_id → profiles.id
-- so PostgREST can resolve the embedded join (e.g. profile:profiles(...))
-- The existing FK to auth.users is kept; this adds a second FK on the same column.

ALTER TABLE roommate_profiles
  ADD CONSTRAINT roommate_profiles_user_id_profiles_fkey
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

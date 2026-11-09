-- Migration 047: Add target listing fields to roommate_profiles for split-rent pairing

ALTER TABLE roommate_profiles
  ADD COLUMN IF NOT EXISTS target_listing_id UUID REFERENCES listings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS target_listing_title TEXT;

CREATE INDEX IF NOT EXISTS idx_roommate_profiles_target_listing_id
  ON roommate_profiles(target_listing_id);

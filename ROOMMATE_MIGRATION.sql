-- Migration for Roommate feature
CREATE TABLE IF NOT EXISTS roommate_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  intent TEXT NOT NULL CHECK (intent IN ('have_room', 'teaming_up')),
  university TEXT NOT NULL,
  budget_min INTEGER NOT NULL,
  budget_max INTEGER NOT NULL,
  gender TEXT NOT NULL,
  preferred_gender TEXT NOT NULL,
  lifestyle_tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  bio TEXT,
  phone_number TEXT NOT NULL,
  room_photos TEXT[] DEFAULT '{}',
  room_address TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'found')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE roommate_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Anyone can view active roommate profiles"
  ON roommate_profiles FOR SELECT
  USING (status = 'active');

CREATE POLICY "Users can manage their own roommate profiles"
  ON roommate_profiles FOR ALL
  USING (auth.uid() = user_id);

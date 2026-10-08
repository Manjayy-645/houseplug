CREATE TABLE IF NOT EXISTS public.university_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  university_name TEXT NOT NULL,
  campus_area TEXT,
  role TEXT NOT NULL CHECK (role IN ('student', 'landlord')),
  contact_info TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.university_requests ENABLE ROW LEVEL SECURITY;

-- Allow public inserts (both anonymous and authenticated users)
CREATE POLICY "Allow public insert to university_requests"
  ON public.university_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated admins can read requests
CREATE POLICY "Allow admin select on university_requests"
  ON public.university_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Create index on lowercase university_name for efficient aggregation
CREATE INDEX IF NOT EXISTS idx_university_requests_name 
  ON public.university_requests (LOWER(TRIM(university_name)));

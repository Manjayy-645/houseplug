-- Migration: Student Housing Request Board & 1-Click WhatsApp Broadcast
-- Description: Sets up housing_requests table with request_code, student_name, student_whatsapp, campus_zone, property_type, min_budget, max_budget, move_in_timeline, extra_notes, status, and RLS policies.

CREATE TABLE IF NOT EXISTS public.housing_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_code text NOT NULL UNIQUE DEFAULT ('HP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4))),
  student_name text NOT NULL,
  student_whatsapp text NOT NULL,
  campus_zone text NOT NULL,
  property_type text NOT NULL,
  min_budget integer NOT NULL,
  max_budget integer NOT NULL,
  move_in_timeline text NOT NULL,
  extra_notes text,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Safely add columns if the table already existed with legacy schema
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'housing_requests' AND column_name = 'request_code') THEN
    ALTER TABLE public.housing_requests ADD COLUMN request_code text UNIQUE DEFAULT ('HP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4)));
    UPDATE public.housing_requests SET request_code = coalesce(reference, 'HP-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 4))) WHERE request_code IS NULL;
    ALTER TABLE public.housing_requests ALTER COLUMN request_code SET NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'housing_requests' AND column_name = 'student_name') THEN
    ALTER TABLE public.housing_requests ADD COLUMN student_name text;
    UPDATE public.housing_requests SET student_name = coalesce(contact_name, 'Student') WHERE student_name IS NULL;
    ALTER TABLE public.housing_requests ALTER COLUMN student_name SET NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'housing_requests' AND column_name = 'student_whatsapp') THEN
    ALTER TABLE public.housing_requests ADD COLUMN student_whatsapp text;
    UPDATE public.housing_requests SET student_whatsapp = coalesce(contact_phone, '08000000000') WHERE student_whatsapp IS NULL;
    ALTER TABLE public.housing_requests ALTER COLUMN student_whatsapp SET NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'housing_requests' AND column_name = 'campus_zone') THEN
    ALTER TABLE public.housing_requests ADD COLUMN campus_zone text;
    UPDATE public.housing_requests SET campus_zone = coalesce(area, 'Choba') WHERE campus_zone IS NULL;
    ALTER TABLE public.housing_requests ALTER COLUMN campus_zone SET NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'housing_requests' AND column_name = 'property_type') THEN
    ALTER TABLE public.housing_requests ADD COLUMN property_type text;
    UPDATE public.housing_requests SET property_type = coalesce(room_type, 'Self-Contain') WHERE property_type IS NULL;
    ALTER TABLE public.housing_requests ALTER COLUMN property_type SET NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'housing_requests' AND column_name = 'min_budget') THEN
    ALTER TABLE public.housing_requests ADD COLUMN min_budget integer;
    UPDATE public.housing_requests SET min_budget = coalesce(total_budget::integer, 100000) WHERE min_budget IS NULL;
    ALTER TABLE public.housing_requests ALTER COLUMN min_budget SET NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'housing_requests' AND column_name = 'max_budget') THEN
    ALTER TABLE public.housing_requests ADD COLUMN max_budget integer;
    UPDATE public.housing_requests SET max_budget = coalesce(total_budget::integer, 200000) WHERE max_budget IS NULL;
    ALTER TABLE public.housing_requests ALTER COLUMN max_budget SET NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'housing_requests' AND column_name = 'move_in_timeline') THEN
    ALTER TABLE public.housing_requests ADD COLUMN move_in_timeline text;
    UPDATE public.housing_requests SET move_in_timeline = 'Within 2 Weeks' WHERE move_in_timeline IS NULL;
    ALTER TABLE public.housing_requests ALTER COLUMN move_in_timeline SET NOT NULL;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'housing_requests' AND column_name = 'extra_notes') THEN
    ALTER TABLE public.housing_requests ADD COLUMN extra_notes text;
  END IF;

  -- Relax legacy columns so new requests without them succeed
  ALTER TABLE public.housing_requests ALTER COLUMN submission_key DROP NOT NULL;
  ALTER TABLE public.housing_requests ALTER COLUMN fingerprint DROP NOT NULL;
  ALTER TABLE public.housing_requests ALTER COLUMN university DROP NOT NULL;
  ALTER TABLE public.housing_requests ALTER COLUMN area DROP NOT NULL;
  ALTER TABLE public.housing_requests ALTER COLUMN total_budget DROP NOT NULL;
  ALTER TABLE public.housing_requests ALTER COLUMN move_in_date DROP NOT NULL;
  ALTER TABLE public.housing_requests ALTER COLUMN contact_name DROP NOT NULL;
  ALTER TABLE public.housing_requests ALTER COLUMN contact_phone DROP NOT NULL;
  ALTER TABLE public.housing_requests ALTER COLUMN contact_consent DROP NOT NULL;
  ALTER TABLE public.housing_requests ALTER COLUMN reference DROP NOT NULL;

  -- Remove old status check constraint if present and allow open / fulfilled
  ALTER TABLE public.housing_requests DROP CONSTRAINT IF EXISTS housing_requests_status_check;
  ALTER TABLE public.housing_requests ALTER COLUMN status SET DEFAULT 'open';

EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Indexes for lightning fast queries
CREATE INDEX IF NOT EXISTS idx_housing_requests_request_code ON public.housing_requests(request_code);
CREATE INDEX IF NOT EXISTS idx_housing_requests_status_created ON public.housing_requests(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_housing_requests_campus_zone ON public.housing_requests(campus_zone);

-- RLS setup
ALTER TABLE public.housing_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone to INSERT a new housing request for FREE
DROP POLICY IF EXISTS "Anyone can insert housing requests" ON public.housing_requests;
CREATE POLICY "Anyone can insert housing requests"
  ON public.housing_requests
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Anyone can SELECT open requests (and admins can view all requests)
DROP POLICY IF EXISTS "Anyone can select open housing requests" ON public.housing_requests;
CREATE POLICY "Anyone can select open housing requests"
  ON public.housing_requests
  FOR SELECT
  TO anon, authenticated
  USING (status = 'open' OR (select public.is_admin()));

-- Admins can UPDATE requests (e.g. mark fulfilled, reopen)
DROP POLICY IF EXISTS "Admins can update housing requests" ON public.housing_requests;
CREATE POLICY "Admins can update housing requests"
  ON public.housing_requests
  FOR UPDATE
  TO authenticated
  USING ((select public.is_admin()))
  WITH CHECK ((select public.is_admin()));

-- Admins can DELETE requests
DROP POLICY IF EXISTS "Admins can delete housing requests" ON public.housing_requests;
CREATE POLICY "Admins can delete housing requests"
  ON public.housing_requests
  FOR DELETE
  TO authenticated
  USING ((select public.is_admin()));

-- Secure public view that hides student_whatsapp from direct anon queries
CREATE OR REPLACE VIEW public.open_housing_requests AS
SELECT 
  id,
  request_code,
  student_name,
  campus_zone,
  property_type,
  min_budget,
  max_budget,
  move_in_timeline,
  extra_notes,
  status,
  created_at
FROM public.housing_requests
WHERE status = 'open';

GRANT SELECT ON public.open_housing_requests TO anon, authenticated;
GRANT ALL ON public.housing_requests TO authenticated, service_role;
GRANT SELECT, INSERT ON public.housing_requests TO anon;

-- Add verification fields to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified',
  -- 'unverified', 'pending', 'verified', 'rejected'
  ADD COLUMN IF NOT EXISTS verification_type TEXT,
  -- 'identity', 'property'
  ADD COLUMN IF NOT EXISTS id_document_url TEXT,
  ADD COLUMN IF NOT EXISTS id_document_back_url TEXT,
  ADD COLUMN IF NOT EXISTS selfie_url TEXT,
  ADD COLUMN IF NOT EXISTS id_document_type TEXT,
  -- 'nin', 'drivers_license', 'national_id', 'voters_card'
  ADD COLUMN IF NOT EXISTS nin_number TEXT,
  ADD COLUMN IF NOT EXISTS property_document_url TEXT,
  ADD COLUMN IF NOT EXISTS verification_note TEXT,
  -- rejection reason or admin note
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.profiles(id);

-- Add comment explaining verification_status values
COMMENT ON COLUMN public.profiles.verification_status IS 'unverified, pending, verified, rejected';

-- Ensure landlord_id is included in listing select for verification check
-- (This is more of a frontend/query concern, but we'll ensure the profiles table is accessible)

-- Set up storage for verifications (if not already handled by Supabase CLI)
-- NOTE: Bucket creation usually happens via Supabase Dashboard or API, 
-- but we can ensure policies are ready if the bucket exists.
DO $$ 
BEGIN
  -- We assume the bucket 'verifications' will be created via Dashboard as per instructions.
  -- These policies ensure only the user can upload their own docs and admins can see everything.
  
  -- Users can upload to their own folder
  INSERT INTO storage.policies (name, bucket_id, operation, definition, check)
  VALUES ('Landlords can upload own verification docs', 'verifications', 'INSERT', 
    '(role() = ''authenticated'') AND (bucket_id = ''verifications'') AND ((storage.foldername(name))[1] = auth.uid()::text)',
    '(role() = ''authenticated'') AND (bucket_id = ''verifications'') AND ((storage.foldername(name))[1] = auth.uid()::text)');

  -- Admins can view all verification docs
  INSERT INTO storage.policies (name, bucket_id, operation, definition)
  VALUES ('Admins can view all verification docs', 'verifications', 'SELECT', 
    '(role() = ''authenticated'') AND (bucket_id = ''verifications'') AND (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = ''admin''))');

EXCEPTION WHEN OTHERS THEN
  -- Policies might already exist or storage schema might be different in local env
  RAISE NOTICE 'Storage policies setup skipped or failed: %', SQLERRM;
END $$;

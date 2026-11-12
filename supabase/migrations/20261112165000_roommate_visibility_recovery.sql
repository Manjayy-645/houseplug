-- Backfill existing roommate profiles so active profiles remain discoverable
UPDATE public.roommate_profiles
SET 
  visibility_consent = true,
  expires_at = COALESCE(expires_at, now() + interval '90 days')
WHERE status = 'active';

-- Ensure default for visibility_consent on active profiles is true
ALTER TABLE public.roommate_profiles
  ALTER COLUMN visibility_consent SET DEFAULT true;

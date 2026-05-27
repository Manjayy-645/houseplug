-- Create storage buckets for avatars and listings
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('listings', 'listings', true)
ON CONFLICT (id) DO NOTHING;

-- Enable RLS on storage.objects (it's usually enabled by default in Supabase)
-- But we ensure we have the right policies

-- 1. AVATARS POLICIES
-- Allow public to view avatars
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

-- Allow authenticated users to upload their own avatar
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
CREATE POLICY "Users can upload their own avatar" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own avatar
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
CREATE POLICY "Users can update their own avatar" ON storage.objects 
FOR UPDATE TO authenticated 
USING (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own avatar
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
CREATE POLICY "Users can delete their own avatar" ON storage.objects 
FOR DELETE TO authenticated 
USING (
  bucket_id = 'avatars' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);


-- 2. LISTINGS POLICIES
-- Allow public to view listing photos
-- Note: "Public Access" is shared across buckets if not filtered by bucket_id in the policy itself
-- So we should name them uniquely or include bucket_id in the USING clause (which we did).
-- However, if we have multiple "Public Access" policies, they might conflict if named the same.

DROP POLICY IF EXISTS "Public Listings Access" ON storage.objects;
CREATE POLICY "Public Listings Access" ON storage.objects FOR SELECT USING (bucket_id = 'listings');

-- Allow authenticated users to upload listing photos
DROP POLICY IF EXISTS "Landlords can upload listing photos" ON storage.objects;
CREATE POLICY "Landlords can upload listing photos" ON storage.objects 
FOR INSERT TO authenticated 
WITH CHECK (
  bucket_id = 'listings' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update listing photos
DROP POLICY IF EXISTS "Landlords can update listing photos" ON storage.objects;
CREATE POLICY "Landlords can update listing photos" ON storage.objects 
FOR UPDATE TO authenticated 
USING (
  bucket_id = 'listings' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete listing photos
DROP POLICY IF EXISTS "Landlords can delete listing photos" ON storage.objects;
CREATE POLICY "Landlords can delete listing photos" ON storage.objects 
FOR DELETE TO authenticated 
USING (
  bucket_id = 'listings' AND 
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Add is_banned to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false;

-- Create bans table
CREATE TABLE IF NOT EXISTS public.bans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  banned_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE SET NULL,
  banned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Create appeals table
CREATE TABLE IF NOT EXISTS public.appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ban_id UUID NOT NULL REFERENCES public.bans(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  appeal_message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on bans
ALTER TABLE public.bans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can insert bans" ON public.bans FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);
CREATE POLICY "Admins can update bans" ON public.bans FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);
CREATE POLICY "Admins can read bans" ON public.bans FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);
CREATE POLICY "Users can read their own bans" ON public.bans FOR SELECT USING (
  auth.uid() = user_id
);

-- Enable RLS on appeals
ALTER TABLE public.appeals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can insert their own appeals" ON public.appeals FOR INSERT WITH CHECK (
  auth.uid() = user_id
);
CREATE POLICY "Users can read their own appeals" ON public.appeals FOR SELECT USING (
  auth.uid() = user_id
);
CREATE POLICY "Admins can read appeals" ON public.appeals FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);
CREATE POLICY "Admins can update appeals" ON public.appeals FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- Add to listings table
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS rejection_count INTEGER DEFAULT 0;

-- Create listing_appeals table
CREATE TABLE IF NOT EXISTS public.listing_appeals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  appeal_type TEXT NOT NULL CHECK (appeal_type IN ('dispute', 'resubmit')),
  appeal_message TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on listing_appeals
ALTER TABLE public.listing_appeals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Landlords can insert their own listing appeals" ON public.listing_appeals FOR INSERT WITH CHECK (
  auth.uid() = landlord_id
);
CREATE POLICY "Landlords can read their own listing appeals" ON public.listing_appeals FOR SELECT USING (
  auth.uid() = landlord_id
);
CREATE POLICY "Admins can read listing appeals" ON public.listing_appeals FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);
CREATE POLICY "Admins can update listing appeals" ON public.listing_appeals FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
);

-- 020_real_time_tracking.sql
-- Ensuring all tracking columns and functions are robust

-- 1. Ensure columns exist on listings
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS whatsapp_clicks INTEGER DEFAULT 0;
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS phone_reveals INTEGER DEFAULT 0;

-- 2. Create/Update Increment Functions
CREATE OR REPLACE FUNCTION public.increment_views(listing_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.listings
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.increment_whatsapp_clicks(listing_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.listings
  SET whatsapp_clicks = COALESCE(whatsapp_clicks, 0) + 1
  WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION public.increment_phone_reveals(listing_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.listings
  SET phone_reveals = COALESCE(phone_reveals, 0) + 1
  WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 3. Grant Permissions
GRANT EXECUTE ON FUNCTION public.increment_views(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_whatsapp_clicks(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_phone_reveals(UUID) TO anon, authenticated;

-- 4. Create a trigger to track views automatically if needed (optional, using RPC for now)

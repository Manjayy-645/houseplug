-- Add whatsapp_clicks column if it doesn't exist
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS whatsapp_clicks INTEGER DEFAULT 0;

-- Function to increment views_count atomically
CREATE OR REPLACE FUNCTION public.increment_views(listing_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.listings
  SET views_count = COALESCE(views_count, 0) + 1
  WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to increment whatsapp_clicks atomically
CREATE OR REPLACE FUNCTION public.increment_whatsapp_clicks(listing_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.listings
  SET whatsapp_clicks = COALESCE(whatsapp_clicks, 0) + 1
  WHERE id = listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution to authenticated and anon users (since students view listings)
GRANT EXECUTE ON FUNCTION public.increment_views(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_whatsapp_clicks(UUID) TO anon, authenticated;

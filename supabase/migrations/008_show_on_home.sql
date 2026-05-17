-- Add show_on_home column to listings table
ALTER TABLE public.listings ADD COLUMN IF NOT EXISTS show_on_home BOOLEAN DEFAULT false;

-- Add index for performance since we filter by this on the landing page
CREATE INDEX IF NOT EXISTS idx_listings_show_on_home ON public.listings(show_on_home) WHERE show_on_home = true;

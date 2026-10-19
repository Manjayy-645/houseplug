-- Service Provider Enhancements: monthly paywall, boost support, custom categories

-- Add new columns to service_providers
ALTER TABLE service_providers
  ADD COLUMN IF NOT EXISTS custom_category_name TEXT,
  ADD COLUMN IF NOT EXISTS custom_category_icon TEXT DEFAULT 'HelpCircle',
  ADD COLUMN IF NOT EXISTS custom_category_color TEXT DEFAULT 'from-gray-600 to-slate-800',
  ADD COLUMN IF NOT EXISTS is_boosted BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS boost_type TEXT,
  ADD COLUMN IF NOT EXISTS boost_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS listing_paid BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS listing_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS listing_payment_ref TEXT;

-- Add 'expired' to status check if it exists, or just allow text
-- (status is already typed as text in practice)

-- Index for querying active, non-expired services
CREATE INDEX IF NOT EXISTS idx_service_providers_active_listing
  ON service_providers (status, listing_expires_at)
  WHERE status = 'active';

-- Index for boosted services
CREATE INDEX IF NOT EXISTS idx_service_providers_boosted
  ON service_providers (is_boosted, boost_expires_at)
  WHERE is_boosted = TRUE;

-- Insert default service_listing_price setting (300000 kobo = ₦3,000)
INSERT INTO platform_settings (key, value, updated_at)
VALUES ('service_listing_price', '300000', NOW())
ON CONFLICT (key) DO NOTHING;

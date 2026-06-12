-- Performance indexes for the hot read paths. The schema shipped with almost
-- no indexes on the columns the app filters, sorts, and joins on every page,
-- which means sequential scans that degrade badly as the catalog grows. All
-- indexes are IF NOT EXISTS, so this is safe to re-run.
--
-- Note: on a large LIVE table you may prefer to create these one-by-one with
-- CREATE INDEX CONCURRENTLY (outside a transaction) to avoid write locks. At
-- the current catalog size a plain CREATE INDEX locks only briefly.

-- LISTINGS -------------------------------------------------------------------
-- Browse always filters status='active' and usually orders by created_at.
CREATE INDEX IF NOT EXISTS idx_listings_status_created
  ON public.listings(status, created_at DESC);

-- The most common added filter is university (status is always present too).
CREATE INDEX IF NOT EXISTS idx_listings_status_university
  ON public.listings(status, university);

-- Landlord dashboard + ownership checks + the profiles FK join.
CREATE INDEX IF NOT EXISTS idx_listings_landlord_id
  ON public.listings(landlord_id);

-- Price range filters and price sort on browse.
CREATE INDEX IF NOT EXISTS idx_listings_price_yearly
  ON public.listings(price_yearly);

-- REVIEWS --------------------------------------------------------------------
-- Joined by listing_id on every listing card, the detail page, and dashboards.
CREATE INDEX IF NOT EXISTS idx_reviews_listing_id
  ON public.reviews(listing_id);

-- PROFILES -------------------------------------------------------------------
-- Admin views filter by role.
CREATE INDEX IF NOT EXISTS idx_profiles_role
  ON public.profiles(role);

-- FULL-TEXT-ISH SEARCH -------------------------------------------------------
-- Browse search does `col ILIKE '%q%'` across these four columns. B-tree can't
-- serve a leading-wildcard LIKE; trigram GIN indexes can, and Postgres will
-- BitmapOr them for the OR query. Requires the pg_trgm extension.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_listings_title_trgm
  ON public.listings USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_listings_address_trgm
  ON public.listings USING gin (address gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_listings_area_trgm
  ON public.listings USING gin (area gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_listings_landmark_trgm
  ON public.listings USING gin (landmark gin_trgm_ops);

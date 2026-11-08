-- 046_admin_performance_and_agent_filter.sql
-- Optimizations for Admin Panel data fetching and user/agent filtering.

-- 1. Optimize is_admin() by marking it STABLE.
-- When not marked STABLE, PostgreSQL defaults to VOLATILE, which forces the function
-- to be re-executed for every single row scanned by RLS policies.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 2. Composite index on profiles(role, verification_status)
-- Used on admin layout sidebar badge, admin dashboard overview, and verification page.
CREATE INDEX IF NOT EXISTS idx_profiles_role_verification
  ON public.profiles(role, verification_status);

-- 3. Trigram extension and indexes for fast admin search across users
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_profiles_full_name_trgm
  ON public.profiles USING gin (full_name gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_profiles_email_trgm
  ON public.profiles USING gin (email gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_profiles_phone
  ON public.profiles(phone);

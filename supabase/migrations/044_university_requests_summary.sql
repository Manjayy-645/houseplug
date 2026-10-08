-- Create an admin aggregation view that normalizes campus names
CREATE OR REPLACE VIEW public.university_requests_summary AS
SELECT 
  INITCAP(LOWER(TRIM(university_name))) AS normalized_name,
  COUNT(*)::INT AS total_requests,
  COUNT(CASE WHEN role = 'student' THEN 1 END)::INT AS student_requests,
  COUNT(CASE WHEN role = 'landlord' THEN 1 END)::INT AS landlord_requests,
  COUNT(DISTINCT contact_info)::INT AS unique_contacts,
  MAX(created_at) AS last_requested_at,
  ARRAY_REMOVE(ARRAY_AGG(DISTINCT NULLIF(TRIM(campus_area), '')), NULL) AS reported_areas
FROM public.university_requests
GROUP BY INITCAP(LOWER(TRIM(university_name)))
ORDER BY total_requests DESC;

-- Grant select access only to authenticated users
ALTER VIEW public.university_requests_summary OWNER TO postgres;

-- Helper RPC for admin query with search filter
CREATE OR REPLACE FUNCTION public.get_university_requests_summary(search_query TEXT DEFAULT '')
RETURNS TABLE (
  normalized_name TEXT,
  total_requests INT,
  student_requests INT,
  landlord_requests INT,
  unique_contacts INT,
  last_requested_at TIMESTAMPTZ,
  reported_areas TEXT[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Strict admin check
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied. Administrator privileges required.';
  END IF;

  RETURN QUERY
  SELECT 
    s.normalized_name,
    s.total_requests,
    s.student_requests,
    s.landlord_requests,
    s.unique_contacts,
    s.last_requested_at,
    s.reported_areas
  FROM public.university_requests_summary s
  WHERE search_query = '' 
     OR s.normalized_name ILIKE '%' || search_query || '%'
  ORDER BY s.total_requests DESC;
END;
$$;

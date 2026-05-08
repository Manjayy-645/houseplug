-- Ensure only one subscription row per landlord
-- First clean up any duplicates, keeping the most recent active one
DELETE FROM public.subscriptions
WHERE id NOT IN (
  SELECT DISTINCT ON (landlord_id) id
  FROM public.subscriptions
  ORDER BY landlord_id, active DESC, created_at DESC
);

-- Add unique constraint so upsert works correctly
ALTER TABLE public.subscriptions
ADD CONSTRAINT subscriptions_landlord_id_key UNIQUE (landlord_id);

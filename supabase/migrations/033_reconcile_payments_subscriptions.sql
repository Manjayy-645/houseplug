-- Reconcile the billing schema with what the application code actually
-- reads and writes. These objects were previously created by hand in the
-- Supabase dashboard, so they exist in production but were never captured in
-- migrations. Everything here is idempotent (IF NOT EXISTS / ADD COLUMN IF
-- NOT EXISTS), so it is safe to run against the live database whether or not
-- the objects already exist.

-- 1. PAYMENTS TABLE -----------------------------------------------------------
-- Audit trail of every Paystack transaction. Written exclusively by the
-- service role from lib/billing.ts and app/api/payments/initiate/route.ts.
-- `amount` is in kobo (₦0.01), matching listing_boosts.amount.
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL,                 -- 'subscription' | 'boost' | 'verification'
  plan TEXT,                          -- 'free' | 'pro' | 'business'
  billing_cycle TEXT,                 -- 'monthly' | 'annual'
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  boost_type TEXT,                    -- 'featured_7' | 'featured_30' | 'urgent' | 'refresh'
  amount INTEGER NOT NULL,            -- kobo
  paystack_reference TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'success' | 'failed'
  created_at TIMESTAMPTZ DEFAULT now()
);

-- The reference is the idempotency key: lib/billing.ts looks a payment up by
-- paystack_reference (.maybeSingle()) to avoid double-applying the callback +
-- webhook. A unique index enforces that invariant at the database level.
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_paystack_reference
  ON public.payments(paystack_reference);
CREATE INDEX IF NOT EXISTS idx_payments_landlord_id
  ON public.payments(landlord_id);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Landlords read their own payment history (subscription page lists them via
-- the authenticated client). Inserts/updates go through the service role,
-- which bypasses RLS, so no write policy for users is needed.
DROP POLICY IF EXISTS "Landlords view own payments" ON public.payments;
CREATE POLICY "Landlords view own payments" ON public.payments
  FOR SELECT TO authenticated USING (landlord_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all payments" ON public.payments;
CREATE POLICY "Admins can view all payments" ON public.payments
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can manage all payments" ON public.payments;
CREATE POLICY "Admins can manage all payments" ON public.payments
  FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- 2. SUBSCRIPTIONS COLUMNS ----------------------------------------------------
-- lib/billing.ts upserts these on every paid subscription, and the landlord
-- subscription page reads billing_cycle / cancelled_at. They were missing from
-- 001_initial.sql (only is_trial was later added in 026_pro_trial.sql).
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS billing_cycle TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS amount_paid INTEGER;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS paystack_reference TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMPTZ;

-- 032_verification_payment.sql
-- Track the one-time verification fee so a rejected user can resubmit for free.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS verification_paid BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS verification_payment_ref TEXT;

-- ₦2,000 in kobo (Paystack uses kobo). Super admins can edit this in settings.
INSERT INTO public.platform_settings (key, value)
VALUES ('verification_fee', '200000')
ON CONFLICT (key) DO NOTHING;

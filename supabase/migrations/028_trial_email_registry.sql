-- 028_trial_email_registry.sql
-- Email-based trial tracking for Google OAuth signups, which have no phone
-- number at sign-up. Google verifies emails, so email is a sound identifier
-- for "one trial per person" on that path. Phone-based signups continue to use
-- trial_phone_registry.

CREATE TABLE IF NOT EXISTS public.trial_email_registry (
  email TEXT PRIMARY KEY,
  used_at TIMESTAMPTZ DEFAULT now()
);

-- Locked down like trial_phone_registry: only the service role / SECURITY
-- DEFINER paths read or write it, so no policies are granted.
ALTER TABLE public.trial_email_registry ENABLE ROW LEVEL SECURITY;

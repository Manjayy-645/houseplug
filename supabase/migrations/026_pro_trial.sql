-- 026_pro_trial.sql
-- 30-day Pro trial for new landlords, one per phone number.

-- 1. Trial tracking
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS is_trial BOOLEAN DEFAULT false;

CREATE TABLE IF NOT EXISTS public.trial_phone_registry (
  phone TEXT PRIMARY KEY,
  used_at TIMESTAMPTZ DEFAULT now()
);

-- Locked down: only the SECURITY DEFINER trigger below (and the service role)
-- read/write this table, so no policies are granted.
ALTER TABLE public.trial_phone_registry ENABLE ROW LEVEL SECURITY;

-- 2. Grant the trial inside the existing new-user trigger. Doing it here (rather
-- than client-side) means it runs once, atomically, regardless of whether the
-- user verifies via OTP or the email link, and bypasses RLS as SECURITY DEFINER.
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role  TEXT := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  v_phone TEXT := NEW.raw_user_meta_data->>'phone';
  v_norm  TEXT := regexp_replace(COALESCE(NEW.raw_user_meta_data->>'phone', ''), '[^0-9]', '', 'g');
BEGIN
  INSERT INTO public.profiles (id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'User'),
    v_phone,
    v_role
  )
  ON CONFLICT (id) DO NOTHING;

  -- 30-day Pro trial for landlords, once per phone number.
  IF v_role = 'landlord' AND v_norm <> '' THEN
    IF NOT EXISTS (SELECT 1 FROM public.trial_phone_registry WHERE phone = v_norm) THEN
      INSERT INTO public.subscriptions
        (landlord_id, plan, is_trial, active, billing_cycle, amount_paid, expires_at)
      VALUES
        (NEW.id, 'pro', true, true, 'trial', 0, now() + interval '30 days')
      ON CONFLICT (landlord_id) DO NOTHING;

      INSERT INTO public.trial_phone_registry (phone)
      VALUES (v_norm)
      ON CONFLICT (phone) DO NOTHING;
    END IF;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN others THEN
    RAISE LOG 'handle_new_user error: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

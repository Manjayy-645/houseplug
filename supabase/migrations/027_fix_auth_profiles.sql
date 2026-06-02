-- 027_fix_auth_profiles.sql
-- Harden the new-user flow and repair accounts that exist in auth.users but
-- are missing a profiles row.
--
-- Notes:
--  * handle_new_user fires AFTER INSERT on auth.users (i.e. at sign-up time),
--    not on email confirmation. The function below keeps the robust error
--    handling and the 30-day landlord Pro trial from migration 026, and is
--    re-asserted here so production is guaranteed to have the latest version.
--  * The real cross-cutting fix lives in /app/auth/callback/route.ts, which now
--    creates the profile via the service role if the trigger ever failed.

-- 1. Re-assert the trigger function (idempotent, preserves the trial grant).
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
    RAISE LOG 'handle_new_user error for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 2. Backfill: create profiles for any existing auth user that is missing one.
INSERT INTO public.profiles (id, email, full_name, phone, role, created_at)
SELECT
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', 'User'),
  COALESCE(au.raw_user_meta_data->>'phone', ''),
  COALESCE(au.raw_user_meta_data->>'role', 'student'),
  au.created_at
FROM auth.users au
LEFT JOIN public.profiles p ON p.id = au.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

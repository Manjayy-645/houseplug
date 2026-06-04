-- 029_trigger_skip_oauth.sql
-- Let /auth/callback exclusively provision OAuth (Google) users so the
-- login-vs-signup distinction can be enforced.
--
-- Why: handle_new_user fires for every auth.users INSERT, including the first
-- Google sign-in. If it pre-creates the profile, the callback can never tell a
-- brand-new Google user (who clicked "Continue with Google" on the LOGIN page)
-- apart from a returning one — a profile would always exist. By skipping
-- non-email providers here, profile-absence in the callback reliably means
-- "this person has never signed up", so login can be rejected correctly.
--
-- Email/password signups (provider = 'email') keep their atomic profile + trial
-- creation here, unchanged.

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_provider TEXT := COALESCE(NEW.raw_app_meta_data->>'provider', 'email');
  v_role  TEXT := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  v_phone TEXT := NEW.raw_user_meta_data->>'phone';
  v_norm  TEXT := regexp_replace(COALESCE(NEW.raw_user_meta_data->>'phone', ''), '[^0-9]', '', 'g');
BEGIN
  -- OAuth users (Google, etc.) are provisioned by /auth/callback.
  IF v_provider <> 'email' THEN
    RETURN NEW;
  END IF;

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

-- 030_agent_role_video.sql
-- Agent role support (role column is free text, so 'agent' needs no schema
-- change) plus agent-fee fields and a per-listing video URL.

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS agent_fee_type TEXT
    CHECK (agent_fee_type IN ('none', 'fixed', 'negotiable'))
    DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS agent_fee_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS video_url TEXT;

CREATE INDEX IF NOT EXISTS idx_listings_video_url
  ON public.listings(video_url) WHERE video_url IS NOT NULL;

-- Agents need the same 30-day Pro trial as landlords. Update handle_new_user
-- (email/password signups) to grant the trial for both roles. OAuth signups are
-- still provisioned by /auth/callback (migration 029).
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

  -- 30-day Pro trial for landlords and agents, once per phone number.
  IF v_role IN ('landlord', 'agent') AND v_norm <> '' THEN
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

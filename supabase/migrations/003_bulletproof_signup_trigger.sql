-- A "bulletproof" version of the trigger to diagnose and fix the issue.
-- It ensures required fields have fallback values to prevent NOT NULL constraint failures.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  meta_full_name TEXT;
  meta_role TEXT;
  meta_phone TEXT;
BEGIN
  -- Extract metadata with fallbacks
  meta_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', 'New User');
  meta_role := COALESCE(NEW.raw_user_meta_data->>'role', 'student');
  meta_phone := NEW.raw_user_meta_data->>'phone';

  INSERT INTO public.profiles (id, email, full_name, phone, role)
  VALUES (
    NEW.id,
    NEW.email,
    meta_full_name,
    meta_phone,
    meta_role
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    phone = EXCLUDED.phone,
    role = EXCLUDED.role;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- This will help pinpoint errors in the Supabase Postgres logs
  RAISE LOG 'Error in handle_new_user trigger for user %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

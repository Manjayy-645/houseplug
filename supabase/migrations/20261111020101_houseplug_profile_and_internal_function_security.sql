-- HousePlug compatibility security patch; no existing user or listing data rewritten.
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '30s';

-- RLS does not protect TRUNCATE. Browser roles never need this privilege.
REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $fn$
DECLARE
  v_provider text := coalesce(NEW.raw_app_meta_data->>'provider', 'email');
  v_requested_role text := NEW.raw_user_meta_data->>'role';
  v_role text;
  v_phone text := NEW.raw_user_meta_data->>'phone';
  v_norm text := regexp_replace(coalesce(NEW.raw_user_meta_data->>'phone', ''), '[^0-9]', '', 'g');
BEGIN
  IF v_provider <> 'email' THEN RETURN NEW; END IF;
  v_role := CASE WHEN v_requested_role IN ('student','landlord','agent')
                 THEN v_requested_role ELSE 'student' END;
  INSERT INTO public.profiles (id,email,full_name,phone,role)
  VALUES (NEW.id,NEW.email,coalesce(NEW.raw_user_meta_data->>'full_name','User'),v_phone,v_role)
  ON CONFLICT (id) DO NOTHING;
  IF v_role IN ('landlord','agent') AND v_norm <> '' THEN
    IF NOT EXISTS (SELECT 1 FROM public.trial_phone_registry WHERE phone=v_norm) THEN
      INSERT INTO public.subscriptions
        (landlord_id,plan,is_trial,active,billing_cycle,amount_paid,expires_at)
      VALUES (NEW.id,'pro',true,true,'trial',0,now()+interval '30 days')
      ON CONFLICT (landlord_id) DO NOTHING;
      INSERT INTO public.trial_phone_registry(phone) VALUES(v_norm)
      ON CONFLICT(phone) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
EXCEPTION WHEN others THEN
  -- Preserve current signup failure behavior, without logging user metadata.
  RAISE LOG 'HousePlug signup provisioning failed (SQLSTATE %)', SQLSTATE;
  RETURN NEW;
END;
$fn$;

-- Invoker trigger: use the real database role, never user-editable metadata.
CREATE FUNCTION public.houseplug_guard_profile_write()
RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER
SET search_path = pg_catalog
AS $fn$
BEGIN
  IF TG_OP='INSERT' THEN
    -- Server OAuth callback must not turn user metadata into administrator roles.
    -- Existing staff promotions use UPDATE through protected server endpoints.
    IF current_user IN ('anon','authenticated','service_role')
       AND (NEW.role NOT IN ('student','landlord','agent') OR NEW.role IS NULL) THEN
      RAISE EXCEPTION 'Privileged roles cannot be assigned during profile signup' USING ERRCODE='42501';
    END IF;
    IF current_user IN ('anon','authenticated') AND
       (coalesce(NEW.banned,false) OR coalesce(NEW.is_banned,false)
        OR coalesce(NEW.verification_paid,false)
        OR NEW.verification_payment_ref IS NOT NULL
        OR NEW.verified_at IS NOT NULL OR NEW.verified_by IS NOT NULL
        OR coalesce(NEW.verification_status,'unverified') <> 'unverified') THEN
      RAISE EXCEPTION 'Protected profile fields require a trusted server operation' USING ERRCODE='42501';
    END IF;
    RETURN NEW;
  END IF;

  IF current_user IN ('anon','authenticated') THEN
    IF ROW(NEW.id,NEW.email,NEW.role,NEW.banned,NEW.is_banned,
           NEW.verification_paid,NEW.verification_payment_ref,NEW.verified_at,NEW.verified_by)
       IS DISTINCT FROM
       ROW(OLD.id,OLD.email,OLD.role,OLD.banned,OLD.is_banned,
           OLD.verification_paid,OLD.verification_payment_ref,OLD.verified_at,OLD.verified_by) THEN
      RAISE EXCEPTION 'Protected profile fields require a trusted server operation' USING ERRCODE='42501';
    END IF;
    IF NEW.verification_status IS DISTINCT FROM OLD.verification_status
       AND (NEW.verification_status IS NULL
            OR NEW.verification_status NOT IN ('unverified','pending')) THEN
      RAISE EXCEPTION 'Verification approval requires a trusted server operation' USING ERRCODE='42501';
    END IF;
    IF NEW.verification_status='pending'
       AND NEW.verification_status IS DISTINCT FROM OLD.verification_status
       AND NOT coalesce(OLD.verification_paid,false) THEN
      RAISE EXCEPTION 'Verification payment is required before resubmission' USING ERRCODE='42501';
    END IF;
    IF OLD.verification_status='verified' AND NEW.verification_status='verified'
       AND ROW(NEW.id_document_url,NEW.id_document_back_url,NEW.selfie_url,
               NEW.property_document_url,NEW.id_document_type,NEW.nin_number,NEW.verification_type)
           IS DISTINCT FROM
           ROW(OLD.id_document_url,OLD.id_document_back_url,OLD.selfie_url,
               OLD.property_document_url,OLD.id_document_type,OLD.nin_number,OLD.verification_type) THEN
      RAISE EXCEPTION 'Changed verification evidence must be resubmitted for review' USING ERRCODE='42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$fn$;
REVOKE ALL ON FUNCTION public.houseplug_guard_profile_write() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER houseplug_guard_profile_write
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.houseplug_guard_profile_write();

ALTER FUNCTION public.expire_listing_boosts() SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.sync_featured_listings() SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.generate_username(text) SET search_path = pg_catalog, public, pg_temp;
ALTER FUNCTION public.increment_service_stat(uuid,text) SET search_path = pg_catalog, public, pg_temp;

-- Trigger/maintenance functions are internal. Intentional public stats RPCs stay available.
REVOKE EXECUTE ON FUNCTION public.handle_new_user(),public.sync_featured_listings(),public.expire_listing_boosts()
FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.expire_listing_boosts() TO service_role;

ALTER VIEW public.university_requests_summary SET (security_invoker=true);
ALTER POLICY "Allow admin select on university_requests" ON public.university_requests
TO authenticated USING ((select public.is_admin()));

CREATE OR REPLACE FUNCTION public.get_university_requests_summary(search_query text DEFAULT '')
RETURNS TABLE(normalized_name text,total_requests integer,student_requests integer,
  landlord_requests integer,unique_contacts integer,last_requested_at timestamptz,reported_areas text[])
LANGUAGE plpgsql SECURITY INVOKER SET search_path = pg_catalog, public, pg_temp
AS $fn$
BEGIN
  IF NOT coalesce(public.is_admin(),false) THEN
    RAISE EXCEPTION 'Access denied. Administrator privileges required.' USING ERRCODE='42501';
  END IF;
  RETURN QUERY SELECT s.normalized_name,s.total_requests,s.student_requests,s.landlord_requests,
    s.unique_contacts,s.last_requested_at,s.reported_areas
  FROM public.university_requests_summary s
  WHERE coalesce(search_query,'')='' OR s.normalized_name ILIKE '%'||search_query||'%'
  ORDER BY s.total_requests DESC;
END;
$fn$;
REVOKE EXECUTE ON FUNCTION public.get_university_requests_summary(text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_university_requests_summary(text) TO authenticated,service_role;
REVOKE ALL ON public.university_requests_summary FROM PUBLIC,anon;
REVOKE INSERT,UPDATE,DELETE,TRIGGER,REFERENCES ON public.university_requests_summary FROM authenticated;
GRANT SELECT ON public.university_requests_summary TO authenticated;
NOTIFY pgrst,'reload schema';
-- Synthetic users exist only inside an exception subtransaction, always rolled back.
DO $test$
DECLARE
  fixture_id uuid := gen_random_uuid();
  email_fixture_id uuid := gen_random_uuid();
  changed integer;
BEGIN
  IF has_table_privilege('anon','public.profiles','TRUNCATE')
     OR has_table_privilege('authenticated','public.listings','TRUNCATE') THEN
    RAISE EXCEPTION 'Browser TRUNCATE privilege still present';
  END IF;
  IF has_function_privilege('anon','public.expire_listing_boosts()','EXECUTE')
     OR has_function_privilege('authenticated','public.sync_featured_listings()','EXECUTE')
     OR has_function_privilege('anon','public.get_university_requests_summary(text)','EXECUTE') THEN
    RAISE EXCEPTION 'Internal function remains exposed';
  END IF;
  BEGIN
    INSERT INTO auth.users(id,email,raw_app_meta_data,raw_user_meta_data)
    VALUES(email_fixture_id,'houseplug-sql-test-'||email_fixture_id||'@example.invalid',
      '{"provider":"email"}'::jsonb,'{"full_name":"SQL test","role":"super_admin"}'::jsonb);
    IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=email_fixture_id AND role='student') THEN
      RAISE EXCEPTION 'Signup metadata role was not sanitized';
    END IF;

    INSERT INTO auth.users(id,email,raw_app_meta_data,raw_user_meta_data)
    VALUES(fixture_id,'houseplug-sql-test-'||fixture_id||'@example.invalid',
      '{"provider":"google"}'::jsonb,'{}'::jsonb);
    INSERT INTO public.profiles(id,email,full_name,role,verification_paid)
    VALUES(fixture_id,'houseplug-sql-test-'||fixture_id||'@example.invalid','SQL test','student',true);
    PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',fixture_id,'role','authenticated')::text,true);
    PERFORM set_config('role','authenticated',true);
    UPDATE public.profiles SET full_name='SQL test updated' WHERE id=fixture_id;
    GET DIAGNOSTICS changed = ROW_COUNT;
    IF changed<>1 THEN RAISE EXCEPTION 'Legitimate own-profile update failed'; END IF;
    BEGIN
      UPDATE public.profiles SET role='super_admin' WHERE id=fixture_id;
      RAISE EXCEPTION 'Role escalation accepted';
    EXCEPTION WHEN insufficient_privilege THEN NULL; END;
    BEGIN
      UPDATE public.profiles SET verification_paid=false WHERE id=fixture_id;
      RAISE EXCEPTION 'Protected payment state update accepted';
    EXCEPTION WHEN insufficient_privilege THEN NULL; END;
    BEGIN
      UPDATE public.profiles SET banned=true WHERE id=fixture_id;
      RAISE EXCEPTION 'Protected ban state update accepted';
    EXCEPTION WHEN insufficient_privilege THEN NULL; END;
    BEGIN
      UPDATE public.profiles SET verification_status='verified' WHERE id=fixture_id;
      RAISE EXCEPTION 'Self verification accepted';
    EXCEPTION WHEN insufficient_privilege THEN NULL; END;
    UPDATE public.profiles SET verification_status='pending',nin_number='synthetic-test-only'
    WHERE id=fixture_id;
    GET DIAGNOSTICS changed = ROW_COUNT;
    IF changed<>1 THEN RAISE EXCEPTION 'Paid resubmission failed'; END IF;
    IF EXISTS(SELECT 1 FROM public.university_requests_summary) THEN
      RAISE EXCEPTION 'Non-admin demand view bypasses RLS';
    END IF;
    BEGIN
      PERFORM * FROM public.get_university_requests_summary('');
      RAISE EXCEPTION 'Non-admin demand RPC accepted';
    EXCEPTION WHEN insufficient_privilege THEN NULL; END;

    PERFORM set_config('role','service_role',true);
    UPDATE public.profiles SET verification_status='verified' WHERE id=fixture_id;
    GET DIAGNOSTICS changed = ROW_COUNT;
    IF changed<>1 THEN RAISE EXCEPTION 'Trusted verification operation failed'; END IF;
    PERFORM set_config('role','authenticated',true);
    BEGIN
      UPDATE public.profiles SET nin_number='changed-evidence' WHERE id=fixture_id;
      RAISE EXCEPTION 'Verified evidence modified without re-review';
    EXCEPTION WHEN insufficient_privilege THEN NULL; END;

    PERFORM set_config('role','postgres',true);
    UPDATE public.profiles SET role='super_admin' WHERE id=fixture_id;
    PERFORM set_config('role','authenticated',true);
    IF NOT public.is_admin() THEN RAISE EXCEPTION 'Super admin lookup failed'; END IF;
    PERFORM * FROM public.university_requests_summary LIMIT 1;
    PERFORM * FROM public.get_university_requests_summary('');
    PERFORM set_config('role','postgres',true);
    -- Roll back both synthetic users, profiles and every test write.
    RAISE EXCEPTION USING ERRCODE='HP001',MESSAGE='HousePlug security assertions passed; fixtures rolled back';
  EXCEPTION WHEN SQLSTATE 'HP001' THEN NULL;
  END;
END;
$test$;

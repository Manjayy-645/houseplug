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

BEGIN;
DO $$
DECLARE owner_id uuid:=gen_random_uuid();staff_id uuid:=gen_random_uuid();service_id uuid;visible integer;
BEGIN
 INSERT INTO auth.users(id,email,raw_app_meta_data) VALUES(owner_id,'service-owner@example.invalid','{"provider":"google"}'::jsonb),(staff_id,'service-staff@example.invalid','{"provider":"google"}'::jsonb);
 INSERT INTO public.profiles(id,email,full_name,role) VALUES(owner_id,'service-owner@example.invalid','Provider','student'),(staff_id,'service-staff@example.invalid','Staff','admin');
 PERFORM set_config('role','authenticated',true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',owner_id)::text,true);
 INSERT INTO public.service_providers(user_id,business_name,category,university,description,pricing_type,price_amount,price_unit,whatsapp_number,status)
 VALUES(owner_id,'Test moving service','moving','uniport','Move boxes and bags near campus for a per trip price.','starting_from',5000,'per trip','08012345678','active') RETURNING id INTO service_id;
 IF (SELECT status FROM public.service_providers WHERE id=service_id)<>'pending' THEN RAISE EXCEPTION 'Provider self-published';END IF;
 PERFORM set_config('role','anon',true);
 PERFORM set_config('request.jwt.claims','{}',true);
 SELECT count(*) INTO visible FROM public.service_providers WHERE id=service_id;IF visible<>0 THEN RAISE EXCEPTION 'Pending service contact exposed';END IF;
 PERFORM set_config('role','service_role',true);
 PERFORM public.review_supplier(service_id,staff_id,jsonb_build_object('approved',true,'days',365,'evidence_reference','synthetic category review','safety_requirements','Provider must secure loads for transport and agree route before work.','service_hours','Confirm directly'));
 PERFORM set_config('role','anon',true);
 PERFORM set_config('request.jwt.claims','{}',true);
 SELECT count(*) INTO visible FROM public.service_providers WHERE id=service_id AND whatsapp_number='08012345678';IF visible<>1 THEN RAISE EXCEPTION 'Approved service contact unavailable';END IF;
 PERFORM set_config('role','authenticated',true);
 PERFORM set_config('request.jwt.claims',jsonb_build_object('sub',owner_id)::text,true);
 UPDATE public.service_providers SET price_amount=7000 WHERE id=service_id;
 IF (SELECT status FROM public.service_providers WHERE id=service_id)<>'pending' THEN RAISE EXCEPTION 'Edited price stayed approved';END IF;
 PERFORM set_config('role','anon',true);
 PERFORM set_config('request.jwt.claims','{}',true);
 SELECT count(*) INTO visible FROM public.service_providers WHERE id=service_id;IF visible<>0 THEN RAISE EXCEPTION 'Edited service contact exposed before review';END IF;
 PERFORM set_config('role','postgres',true);
END $$;
ROLLBACK;

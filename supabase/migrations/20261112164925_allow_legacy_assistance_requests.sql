-- Permit optional requests linked to visible legacy inventory without inventing review dates.
-- Direct advertiser WhatsApp contact remains the primary listing action.
CREATE OR REPLACE FUNCTION public.create_housing_request(payload jsonb,request_fingerprint text,rate_key text)
RETURNS TABLE(id uuid,reference text) LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public,houseplug_private,pg_temp AS $$
DECLARE h public.housing_requests; l public.listings; existing public.housing_requests; iid uuid;
BEGIN
 PERFORM pg_advisory_xact_lock(hashtextextended(rate_key,0));
 PERFORM pg_advisory_xact_lock(hashtextextended('fingerprint:'||request_fingerprint,0));
 SELECT * INTO existing FROM public.housing_requests WHERE submission_key=(payload->>'submission_key')::uuid;
 IF FOUND THEN
  IF existing.fingerprint<>request_fingerprint THEN RAISE EXCEPTION 'Submission key conflict' USING ERRCODE='23505'; END IF;
  RETURN QUERY SELECT existing.id,existing.reference; RETURN;
 END IF;
 IF (SELECT count(*) FROM houseplug_private.request_limits r WHERE r.key=rate_key AND r.created_at>now()-interval '15 minutes')>=5 THEN RAISE EXCEPTION 'Too many requests' USING ERRCODE='54000'; END IF;
 INSERT INTO houseplug_private.request_limits(key) VALUES(rate_key);
 SELECT * INTO existing FROM public.housing_requests WHERE fingerprint=request_fingerprint AND created_at>now()-interval '24 hours' ORDER BY created_at DESC LIMIT 1;
 IF FOUND THEN RETURN QUERY SELECT existing.id,existing.reference; RETURN; END IF;
 IF payload->>'listing_id' IS NOT NULL THEN
  SELECT * INTO l FROM public.listings WHERE listings.id=(payload->>'listing_id')::uuid FOR SHARE;
  IF NOT FOUND OR l.status<>'active' OR l.availability_state<>'active' OR NOT ((l.legacy_inventory AND l.last_confirmed_at IS NULL) OR (l.last_confirmed_at<=now() AND l.availability_expires_at>now())) THEN RAISE EXCEPTION 'Property is not available for assistance'; END IF;
 END IF;
 INSERT INTO public.housing_requests(submission_key,fingerprint,user_id,listing_id,assigned_agent_id,university,area,total_budget,move_in_date,room_type,contact_name,contact_phone,contact_email,contact_consent,marketing_consent,reminder_consent,source,medium,campaign,content_code,referral_code)
 VALUES((payload->>'submission_key')::uuid,request_fingerprint,(payload->>'user_id')::uuid,(payload->>'listing_id')::uuid,l.landlord_id,payload->>'university',payload->>'area',(payload->>'total_budget')::bigint,(payload->>'move_in_date')::date,payload->>'room_type',payload->>'contact_name',payload->>'contact_phone',payload->>'contact_email',(payload->>'contact_consent')::boolean,coalesce((payload->>'marketing_consent')::boolean,false),coalesce((payload->>'reminder_consent')::boolean,false),payload->>'source',payload->>'medium',payload->>'campaign',payload->>'content_code',payload->>'referral_code') RETURNING * INTO h;
 INSERT INTO public.lead_events(lead_id,event,next_status) VALUES(h.id,'housing_request_submitted','new');
 INSERT INTO public.notification_outbox(lead_id,event,dedupe_key) VALUES(h.id,'housing_request_submitted',h.id::text||':submitted');
 RETURN QUERY SELECT h.id,h.reference;
END $$;
REVOKE ALL ON FUNCTION public.create_housing_request(jsonb,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.create_housing_request(jsonb,text,text) TO service_role;

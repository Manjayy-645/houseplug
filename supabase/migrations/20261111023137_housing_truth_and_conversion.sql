-- Additive application schema. Historical rows remain unconfirmed until reviewed.
SET LOCAL lock_timeout='5s';
CREATE SCHEMA IF NOT EXISTS houseplug_private;
REVOKE ALL ON SCHEMA houseplug_private FROM PUBLIC,anon,authenticated;
CREATE OR REPLACE FUNCTION public.houseplug_fee_total(rent integer,items jsonb,complete boolean)
RETURNS bigint LANGUAGE plpgsql IMMUTABLE SECURITY INVOKER SET search_path=pg_catalog AS $$
DECLARE total bigint:=rent; f jsonb;
BEGIN
 IF NOT complete OR rent IS NULL OR rent<0 THEN RETURN NULL; END IF;
 IF jsonb_typeof(items)<>'array' THEN RETURN NULL; END IF;
 FOR f IN SELECT value FROM jsonb_array_elements(items) LOOP
  IF coalesce((f->>'mandatory')::boolean,false) AND f->>'type'<>'inspection' THEN
   IF f->>'amount' IS NULL OR f->>'amount' !~ '^[0-9]+$' THEN RETURN NULL; END IF;
   total:=total+(f->>'amount')::bigint;
  END IF;
 END LOOP;
 RETURN total;
END $$;
ALTER TABLE public.listings
 ADD COLUMN IF NOT EXISTS fee_items jsonb NOT NULL DEFAULT '[]'::jsonb,
 ADD COLUMN IF NOT EXISTS fees_complete boolean NOT NULL DEFAULT false,
 ADD COLUMN IF NOT EXISTS fee_source text,
 ADD COLUMN IF NOT EXISTS last_fee_verified_at timestamptz,
 ADD COLUMN IF NOT EXISTS price_verified_by uuid REFERENCES public.profiles(id),
 ADD COLUMN IF NOT EXISTS renewal_amount bigint,
 ADD COLUMN IF NOT EXISTS sharing_allowed boolean NOT NULL DEFAULT false,
 ADD COLUMN IF NOT EXISTS availability_state text NOT NULL DEFAULT 'unconfirmed' CHECK(availability_state IN ('unconfirmed','draft','pending_review','active','paused','under_offer','rented','expired','removed')),
 ADD COLUMN IF NOT EXISTS last_confirmed_at timestamptz,
 ADD COLUMN IF NOT EXISTS availability_expires_at timestamptz,
 ADD COLUMN IF NOT EXISTS media_confirmed_at timestamptz,
 ADD COLUMN IF NOT EXISTS authority_checked_at timestamptz,
 ADD COLUMN IF NOT EXISTS physically_inspected_at timestamptz,
 ADD COLUMN IF NOT EXISTS evidence_expires_at timestamptz,
 ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now(),
 ADD COLUMN IF NOT EXISTS total_initial_payment bigint GENERATED ALWAYS AS (public.houseplug_fee_total(price_yearly,fee_items,fees_complete)) STORED;
CREATE INDEX IF NOT EXISTS listings_current_inventory ON public.listings(university,area,availability_expires_at) WHERE status='active' AND availability_state='active';
CREATE TABLE public.verification_evidence (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),listing_id uuid REFERENCES public.listings(id) ON DELETE CASCADE,
 subject_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
 dimension text NOT NULL CHECK(dimension IN ('identity_checked','authority_to_list_checked','property_physically_inspected','availability_confirmed')),
 checked_at timestamptz NOT NULL DEFAULT now(),expires_at timestamptz NOT NULL,reviewer_id uuid NOT NULL REFERENCES public.profiles(id),
 evidence_pointer text NOT NULL,revoked_at timestamptz,revocation_reason text,
 CHECK(expires_at>checked_at),CHECK(listing_id IS NOT NULL OR subject_id IS NOT NULL)
);
ALTER TABLE public.verification_evidence ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.verification_evidence FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.verification_evidence TO service_role;
CREATE TABLE public.housing_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),reference text NOT NULL UNIQUE DEFAULT ('HP-'||upper(substr(replace(gen_random_uuid()::text,'-',''),1,16))),
 submission_key uuid NOT NULL UNIQUE,fingerprint text NOT NULL,user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,assigned_agent_id uuid REFERENCES public.profiles(id),university text NOT NULL,area text NOT NULL,
 total_budget bigint NOT NULL CHECK(total_budget>0),move_in_date date NOT NULL,room_type text,
 contact_name text NOT NULL,contact_phone text NOT NULL,contact_email text,contact_consent boolean NOT NULL CHECK(contact_consent),
 marketing_consent boolean NOT NULL DEFAULT false,reminder_consent boolean NOT NULL DEFAULT false,consented_at timestamptz NOT NULL DEFAULT now(),
 source text,medium text,campaign text,content_code text,referral_code text,
 status text NOT NULL DEFAULT 'new' CHECK(status IN ('new','qualified','matching','connected','closed_unmatched','cancelled','rented','spam')),
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX housing_request_owner ON public.housing_requests(user_id,created_at DESC);
CREATE INDEX housing_request_fingerprint ON public.housing_requests(fingerprint,created_at DESC);
CREATE TABLE public.lead_events (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,lead_id uuid NOT NULL REFERENCES public.housing_requests(id) ON DELETE CASCADE,
 actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
 event text NOT NULL,previous_status text,next_status text,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX lead_event_history ON public.lead_events(lead_id,created_at);
CREATE TABLE public.notification_outbox (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),lead_id uuid REFERENCES public.housing_requests(id) ON DELETE CASCADE,
 event text NOT NULL,dedupe_key text NOT NULL UNIQUE,attempts integer NOT NULL DEFAULT 0,status text NOT NULL DEFAULT 'pending',
 next_attempt_at timestamptz NOT NULL DEFAULT now(),sent_at timestamptz,last_error text,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX outbox_pending ON public.notification_outbox(next_attempt_at) WHERE status IN ('pending','retry');
CREATE TABLE houseplug_private.request_limits (key text NOT NULL,created_at timestamptz NOT NULL DEFAULT now());
ALTER TABLE houseplug_private.request_limits ENABLE ROW LEVEL SECURITY;
CREATE INDEX request_limit_key ON houseplug_private.request_limits(key,created_at);
GRANT USAGE ON SCHEMA houseplug_private TO service_role;
GRANT ALL ON ALL TABLES IN SCHEMA houseplug_private TO service_role;
CREATE TABLE public.reports (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),reporter_id uuid NOT NULL REFERENCES auth.users(id),
 listing_id uuid REFERENCES public.listings(id),target_user_id uuid REFERENCES public.profiles(id),service_id uuid REFERENCES public.service_providers(id),
 category text NOT NULL,description text NOT NULL,status text NOT NULL DEFAULT 'new',resolution text,
 created_at timestamptz NOT NULL DEFAULT now(),resolved_at timestamptz
);
CREATE TABLE public.roommate_connections (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),requester_id uuid NOT NULL REFERENCES public.profiles(id),recipient_id uuid NOT NULL REFERENCES public.profiles(id),
 status text NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','accepted','declined','revoked')),
 created_at timestamptz NOT NULL DEFAULT now(),updated_at timestamptz NOT NULL DEFAULT now(),UNIQUE(requester_id,recipient_id),CHECK(requester_id<>recipient_id)
);
CREATE TABLE public.user_blocks (
 blocker_id uuid NOT NULL REFERENCES public.profiles(id),blocked_id uuid NOT NULL REFERENCES public.profiles(id),
 created_at timestamptz NOT NULL DEFAULT now(),PRIMARY KEY(blocker_id,blocked_id),CHECK(blocker_id<>blocked_id)
);
ALTER TABLE public.roommate_profiles ADD COLUMN IF NOT EXISTS visibility_consent boolean NOT NULL DEFAULT false,
 ADD COLUMN IF NOT EXISTS expires_at timestamptz,ADD COLUMN IF NOT EXISTS move_in_date date,
 ADD COLUMN IF NOT EXISTS score_opt_in boolean NOT NULL DEFAULT false;
ALTER TABLE public.service_providers ADD COLUMN IF NOT EXISTS vetted_at timestamptz,ADD COLUMN IF NOT EXISTS vetting_expires_at timestamptz,
 ADD COLUMN IF NOT EXISTS service_hours text,ADD COLUMN IF NOT EXISTS safety_requirements text;
CREATE TABLE public.service_requests (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),requester_id uuid NOT NULL REFERENCES public.profiles(id),
 provider_id uuid NOT NULL REFERENCES public.service_providers(id),description text NOT NULL,status text NOT NULL DEFAULT 'new',
 contact_consent boolean NOT NULL CHECK(contact_consent),created_at timestamptz NOT NULL DEFAULT now(),completed_at timestamptz
);
CREATE TABLE public.referral_codes (
 code text PRIMARY KEY CHECK(code~'^[a-z0-9_-]{3,40}$'),ambassador_id uuid REFERENCES public.profiles(id),campaign text NOT NULL,
 active boolean NOT NULL DEFAULT false,expires_at timestamptz,created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.content_pages (
 slug text PRIMARY KEY,title text NOT NULL,body text NOT NULL,author text NOT NULL,reviewed_at timestamptz,reviewed_by uuid REFERENCES public.profiles(id),
 published_at timestamptz,university text,area text,updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.funnel_events (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),event text NOT NULL,session_id uuid,lead_id uuid REFERENCES public.housing_requests(id) ON DELETE CASCADE,
 listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,assigned_agent_id uuid REFERENCES public.profiles(id),university text,source text,medium text,campaign text,
 dedupe_key text NOT NULL UNIQUE,created_at timestamptz NOT NULL DEFAULT now()
);
DO $$ DECLARE t text; BEGIN
 FOREACH t IN ARRAY ARRAY['housing_requests','lead_events','notification_outbox','reports','roommate_connections','user_blocks','service_requests','referral_codes','content_pages','funnel_events'] LOOP
  EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t);
  EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC,anon,authenticated',t);
  EXECUTE format('GRANT ALL ON public.%I TO service_role',t);
 END LOOP;
END $$;
GRANT USAGE,SELECT ON SEQUENCE public.lead_events_id_seq TO service_role;
GRANT SELECT ON public.housing_requests,public.lead_events,public.reports,public.roommate_connections,public.user_blocks,public.service_requests,public.content_pages TO authenticated;
GRANT SELECT ON public.content_pages TO anon;
CREATE POLICY own_housing_request ON public.housing_requests FOR SELECT TO authenticated USING(user_id=(select auth.uid()) OR (assigned_agent_id=(select auth.uid()) AND contact_consent) OR (select public.is_admin()));
CREATE POLICY own_lead_history ON public.lead_events FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.housing_requests h WHERE h.id=lead_id AND (h.user_id=(select auth.uid()) OR (select public.is_admin()))));
CREATE POLICY own_reports ON public.reports FOR SELECT TO authenticated USING(reporter_id=(select auth.uid()) OR (select public.is_admin()));
CREATE POLICY connection_participants ON public.roommate_connections FOR SELECT TO authenticated USING(requester_id=(select auth.uid()) OR recipient_id=(select auth.uid()));
CREATE POLICY own_blocks ON public.user_blocks FOR SELECT TO authenticated USING(blocker_id=(select auth.uid()));
CREATE POLICY own_service_requests ON public.service_requests FOR SELECT TO authenticated USING(requester_id=(select auth.uid()) OR (select public.is_admin()) OR EXISTS(SELECT 1 FROM public.service_providers s WHERE s.id=provider_id AND s.user_id=(select auth.uid())));
CREATE POLICY published_content ON public.content_pages FOR SELECT TO anon,authenticated USING(published_at<=now() AND reviewed_at IS NOT NULL);

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
  IF NOT FOUND OR l.status<>'active' OR l.availability_state<>'active' OR coalesce(l.availability_expires_at<=now(),true) THEN RAISE EXCEPTION 'Property availability must be reconfirmed'; END IF;
 END IF;
 INSERT INTO public.housing_requests(submission_key,fingerprint,user_id,listing_id,assigned_agent_id,university,area,total_budget,move_in_date,room_type,contact_name,contact_phone,contact_email,contact_consent,marketing_consent,reminder_consent,source,medium,campaign,content_code,referral_code)
 VALUES((payload->>'submission_key')::uuid,request_fingerprint,(payload->>'user_id')::uuid,(payload->>'listing_id')::uuid,l.landlord_id,payload->>'university',payload->>'area',(payload->>'total_budget')::bigint,(payload->>'move_in_date')::date,payload->>'room_type',payload->>'contact_name',payload->>'contact_phone',payload->>'contact_email',(payload->>'contact_consent')::boolean,coalesce((payload->>'marketing_consent')::boolean,false),coalesce((payload->>'reminder_consent')::boolean,false),payload->>'source',payload->>'medium',payload->>'campaign',payload->>'content_code',payload->>'referral_code') RETURNING * INTO h;
 INSERT INTO public.lead_events(lead_id,event,next_status) VALUES(h.id,'housing_request_submitted','new');
 INSERT INTO public.notification_outbox(lead_id,event,dedupe_key) VALUES(h.id,'housing_request_submitted',h.id::text||':submitted');
 RETURN QUERY SELECT h.id,h.reference;
END $$;
REVOKE ALL ON FUNCTION public.create_housing_request(jsonb,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.create_housing_request(jsonb,text,text) TO service_role;

-- New policies replace public contact-row access. Public pages use narrow server projections.
DO $$ DECLARE p record; BEGIN
 FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='profiles' AND cmd='SELECT' LOOP EXECUTE format('DROP POLICY %I ON public.profiles',p.policyname); END LOOP;
END $$;
CREATE POLICY private_profiles_read ON public.profiles FOR SELECT TO authenticated USING(id=(select auth.uid()) OR (select public.is_admin()));
-- No anonymous profile queries: public listing reads are explicit server projections.
REVOKE SELECT ON public.profiles FROM anon;
DO $$ DECLARE c record; BEGIN
 FOR c IN SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles' LOOP EXECUTE format('REVOKE SELECT(%I) ON public.profiles FROM anon',c.column_name); END LOOP;
 FOR c IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='roommate_profiles' LOOP EXECUTE format('DROP POLICY %I ON public.roommate_profiles',c.policyname); END LOOP;
END $$;
CREATE POLICY private_roommate_ownership ON public.roommate_profiles FOR ALL TO authenticated USING(user_id=(select auth.uid()) OR (select public.is_admin())) WITH CHECK(user_id=(select auth.uid()) OR (select public.is_admin()));
REVOKE ALL ON public.roommate_profiles FROM anon;

CREATE OR REPLACE FUNCTION public.houseplug_guard_listing_truth() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
BEGIN
 NEW.updated_at:=now();
 IF current_user IN ('anon','authenticated') THEN
  IF TG_OP='INSERT' THEN
   NEW.status:='pending';NEW.availability_state:='pending_review';NEW.is_featured:=false;NEW.show_on_home:=false;
   NEW.fees_complete:=false;NEW.last_fee_verified_at:=NULL;NEW.price_verified_by:=NULL;
   NEW.media_confirmed_at:=NULL;NEW.authority_checked_at:=NULL;NEW.physically_inspected_at:=NULL;NEW.evidence_expires_at:=NULL;
   NEW.last_confirmed_at:=NULL;NEW.availability_expires_at:=NULL;
  ELSE
   IF NEW.landlord_id IS DISTINCT FROM OLD.landlord_id OR NEW.id IS DISTINCT FROM OLD.id OR ROW(NEW.media_confirmed_at,NEW.authority_checked_at,NEW.physically_inspected_at,NEW.evidence_expires_at,NEW.last_fee_verified_at,NEW.price_verified_by) IS DISTINCT FROM ROW(OLD.media_confirmed_at,OLD.authority_checked_at,OLD.physically_inspected_at,OLD.evidence_expires_at,OLD.last_fee_verified_at,OLD.price_verified_by) THEN RAISE EXCEPTION 'Admin review required' USING ERRCODE='42501'; END IF;
   IF NEW.status='active' AND OLD.status NOT IN ('active','unavailable') THEN RAISE EXCEPTION 'Cannot self-publish listing' USING ERRCODE='42501';END IF;
   NEW.is_featured:=OLD.is_featured;NEW.show_on_home:=OLD.show_on_home;NEW.fees_complete:=OLD.fees_complete;
   NEW.last_confirmed_at:=OLD.last_confirmed_at;NEW.availability_expires_at:=OLD.availability_expires_at;
   IF ROW(NEW.price_yearly,NEW.fee_items,NEW.agent_fee_type,NEW.agent_fee_amount,NEW.description,NEW.title,NEW.address,NEW.area,NEW.university,NEW.video_url,NEW.photos,NEW.sharing_allowed,NEW.occupancy) IS DISTINCT FROM ROW(OLD.price_yearly,OLD.fee_items,OLD.agent_fee_type,OLD.agent_fee_amount,OLD.description,OLD.title,OLD.address,OLD.area,OLD.university,OLD.video_url,OLD.photos,OLD.sharing_allowed,OLD.occupancy) THEN
    NEW.status:='pending';NEW.availability_state:='pending_review';NEW.fees_complete:=false;NEW.last_fee_verified_at:=NULL;
   END IF;
  END IF;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.houseplug_guard_listing_truth() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER houseplug_guard_listing_truth BEFORE INSERT OR UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION public.houseplug_guard_listing_truth();
REVOKE TRUNCATE ON ALL TABLES IN SCHEMA public FROM PUBLIC,anon,authenticated;
NOTIFY pgrst,'reload schema';
CREATE OR REPLACE FUNCTION public.transition_housing_request(request_id uuid,actor_id uuid,next_status text,agent_id uuid DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE h public.housing_requests;staff boolean;agent boolean;student boolean;allowed text[];
BEGIN
 SELECT * INTO h FROM public.housing_requests WHERE id=request_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Request not found';END IF;
 SELECT role IN ('admin','super_admin') AND NOT coalesce(banned,false) AND NOT coalesce(is_banned,false) INTO staff FROM public.profiles WHERE id=actor_id;
 agent:=h.assigned_agent_id=actor_id;student:=h.user_id=actor_id;
 IF NOT coalesce(staff OR agent OR student,false) THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501';END IF;
 IF EXISTS(SELECT 1 FROM public.profiles WHERE id=actor_id AND (coalesce(banned,false) OR coalesce(is_banned,false))) THEN RAISE EXCEPTION 'Account suspended' USING ERRCODE='42501';END IF;
 IF agent_id IS NOT NULL AND NOT coalesce(staff,false) THEN RAISE EXCEPTION 'Admin assignment required' USING ERRCODE='42501';END IF;
 IF agent_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=agent_id AND role IN ('landlord','agent') AND NOT coalesce(banned,false) AND NOT coalesce(is_banned,false)) THEN RAISE EXCEPTION 'Agent unavailable';END IF;
 IF next_status=h.status THEN RETURN;END IF;
 allowed:=CASE h.status WHEN 'new' THEN ARRAY['qualified','spam','cancelled'] WHEN 'qualified' THEN ARRAY['matching','connected','closed_unmatched','cancelled'] WHEN 'matching' THEN ARRAY['connected','closed_unmatched','cancelled'] WHEN 'connected' THEN ARRAY['rented','closed_unmatched','cancelled'] ELSE ARRAY[]::text[] END;
 IF NOT next_status=ANY(allowed) OR (coalesce(student,false) AND NOT coalesce(staff OR agent,false) AND next_status<>'cancelled') THEN RAISE EXCEPTION 'Invalid transition' USING ERRCODE='22023';END IF;
 UPDATE public.housing_requests SET status=next_status,assigned_agent_id=coalesce(agent_id,assigned_agent_id),updated_at=now() WHERE id=request_id;
 INSERT INTO public.lead_events(lead_id,actor_id,event,previous_status,next_status) VALUES(h.id,actor_id,next_status,h.status,next_status);
 INSERT INTO public.notification_outbox(lead_id,event,dedupe_key) VALUES(h.id,next_status,h.id::text||':'||next_status);
END $$;
REVOKE ALL ON FUNCTION public.transition_housing_request(uuid,uuid,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.transition_housing_request(uuid,uuid,text,uuid) TO service_role;
CREATE TABLE houseplug_private.listing_fee_reviews (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
 reviewer_id uuid NOT NULL REFERENCES public.profiles(id),source text NOT NULL,evidence_pointer text NOT NULL,created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE houseplug_private.listing_fee_reviews ENABLE ROW LEVEL SECURITY;
GRANT SELECT,INSERT ON houseplug_private.listing_fee_reviews TO service_role;
CREATE OR REPLACE FUNCTION public.review_listing_truth(listing_id uuid,reviewer_id uuid,payload jsonb)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE l public.listings;stamp timestamptz:=now();dim text;expiry timestamptz;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=reviewer_id AND p.role IN ('admin','super_admin') AND NOT coalesce(p.banned,false) AND NOT coalesce(p.is_banned,false)) THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501';END IF;
 SELECT * INTO l FROM public.listings WHERE id=listing_id FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Listing not found';END IF;
 IF jsonb_typeof(payload->'fee_items')<>'array' OR nullif(payload->>'fee_source','') IS NULL OR nullif(payload->>'evidence_pointer','') IS NULL THEN RAISE EXCEPTION 'Review evidence required';END IF;
 IF (payload->>'fees_complete')::boolean AND public.houseplug_fee_total(l.price_yearly,payload->'fee_items',true) IS NULL THEN RAISE EXCEPTION 'Unknown mandatory fees';END IF;
 expiry:=stamp+make_interval(days=>least(365,greatest(1,(payload->>'evidence_days')::integer)));
 UPDATE public.verification_evidence e SET revoked_at=stamp,revocation_reason='Superseded by property review' WHERE e.listing_id=review_listing_truth.listing_id AND revoked_at IS NULL;
 FOREACH dim IN ARRAY ARRAY['authority_to_list_checked','property_physically_inspected','availability_confirmed'] LOOP
  IF (CASE dim WHEN 'authority_to_list_checked' THEN (payload->>'authority_checked')::boolean WHEN 'property_physically_inspected' THEN (payload->>'physically_inspected')::boolean ELSE (payload->>'confirm_availability')::boolean END) THEN
   INSERT INTO public.verification_evidence(listing_id,dimension,checked_at,expires_at,reviewer_id,evidence_pointer) VALUES(l.id,dim,stamp,expiry,reviewer_id,payload->>'evidence_pointer');
  END IF;
 END LOOP;
 INSERT INTO houseplug_private.listing_fee_reviews(listing_id,reviewer_id,source,evidence_pointer) VALUES(l.id,reviewer_id,payload->>'fee_source',payload->>'evidence_pointer');
 UPDATE public.listings SET fee_items=payload->'fee_items',fees_complete=(payload->>'fees_complete')::boolean,fee_source='Source reviewed by HousePlug',renewal_amount=(payload->>'renewal_amount')::bigint,
 last_fee_verified_at=stamp,price_verified_by=reviewer_id,sharing_allowed=(payload->>'sharing_allowed')::boolean,occupancy=(payload->>'occupancy')::integer,
 status=CASE WHEN (payload->>'confirm_availability')::boolean THEN 'active' ELSE status END,
 availability_state=CASE WHEN (payload->>'confirm_availability')::boolean THEN 'active' ELSE 'unconfirmed' END,
 last_confirmed_at=CASE WHEN (payload->>'confirm_availability')::boolean THEN stamp ELSE NULL END,
 availability_expires_at=CASE WHEN (payload->>'confirm_availability')::boolean THEN stamp+make_interval(days=>least(30,greatest(1,(payload->>'availability_days')::integer))) ELSE NULL END,
 media_confirmed_at=CASE WHEN (payload->>'confirm_media')::boolean THEN stamp ELSE NULL END,
 authority_checked_at=CASE WHEN (payload->>'authority_checked')::boolean THEN stamp ELSE NULL END,
 physically_inspected_at=CASE WHEN (payload->>'physically_inspected')::boolean THEN stamp ELSE NULL END,evidence_expires_at=expiry,updated_at=stamp WHERE id=l.id;
END $$;
REVOKE ALL ON FUNCTION public.review_listing_truth(uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.review_listing_truth(uuid,uuid,jsonb) TO service_role;
CREATE OR REPLACE FUNCTION public.manage_roommate_connection(actor_id uuid,target_id uuid,action text)
RETURNS text LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE c public.roommate_connections;contact text;
BEGIN
 IF actor_id=target_id OR NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=actor_id AND role='student' AND NOT coalesce(banned,false) AND NOT coalesce(is_banned,false)) THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501';END IF;
 PERFORM pg_advisory_xact_lock(hashtextextended(least(actor_id::text,target_id::text)||greatest(actor_id::text,target_id::text),0));
 IF action='block' THEN
  INSERT INTO public.user_blocks(blocker_id,blocked_id) VALUES(actor_id,target_id) ON CONFLICT DO NOTHING;
  UPDATE public.roommate_connections SET status='revoked',updated_at=now() WHERE (requester_id=actor_id AND recipient_id=target_id) OR (requester_id=target_id AND recipient_id=actor_id);
  RETURN NULL;
 END IF;
 IF EXISTS(SELECT 1 FROM public.user_blocks WHERE (blocker_id=actor_id AND blocked_id=target_id) OR (blocker_id=target_id AND blocked_id=actor_id)) THEN RAISE EXCEPTION 'Connection unavailable';END IF;
 SELECT * INTO c FROM public.roommate_connections WHERE (requester_id=actor_id AND recipient_id=target_id) OR (requester_id=target_id AND recipient_id=actor_id) LIMIT 1 FOR UPDATE;
 IF action='revoke' AND c.id IS NOT NULL THEN UPDATE public.roommate_connections SET status='revoked',updated_at=now() WHERE id=c.id;RETURN NULL;END IF;
 IF NOT EXISTS(SELECT 1 FROM public.roommate_profiles WHERE user_id=actor_id AND status='active' AND visibility_consent AND expires_at>now()) OR NOT EXISTS(SELECT 1 FROM public.roommate_profiles WHERE user_id=target_id AND status='active' AND visibility_consent AND expires_at>now()) THEN RAISE EXCEPTION 'Profile unavailable';END IF;
 IF action='request' THEN
  IF c.id IS NOT NULL THEN RETURN NULL;END IF;
  IF (SELECT count(*) FROM public.roommate_connections WHERE requester_id=actor_id AND created_at>now()-interval '1 day')>=10 THEN RAISE EXCEPTION 'Request limit reached';END IF;
  INSERT INTO public.roommate_connections(requester_id,recipient_id) VALUES(actor_id,target_id);RETURN NULL;
 END IF;
 IF c.id IS NULL THEN RAISE EXCEPTION 'Connection not found';END IF;
 IF action IN ('accept','decline') AND c.recipient_id=actor_id AND c.status='pending' THEN
  UPDATE public.roommate_connections SET status=CASE action WHEN 'accept' THEN 'accepted' ELSE 'declined' END,updated_at=now() WHERE id=c.id;RETURN NULL;
 END IF;
 IF action='contact' AND c.status='accepted' THEN SELECT phone_number INTO contact FROM public.roommate_profiles WHERE user_id=target_id;RETURN contact;END IF;
 RAISE EXCEPTION 'Invalid connection transition';
END $$;
REVOKE ALL ON FUNCTION public.manage_roommate_connection(uuid,uuid,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.manage_roommate_connection(uuid,uuid,text) TO service_role;
-- Server-side qualification events are never inferred from outbound clicks.
CREATE OR REPLACE FUNCTION public.houseplug_record_lead_event() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE h public.housing_requests;
BEGIN
 SELECT * INTO h FROM public.housing_requests WHERE id=NEW.lead_id;
 INSERT INTO public.funnel_events(event,lead_id,university,source,medium,campaign,dedupe_key)
 VALUES(CASE NEW.event WHEN 'qualified' THEN 'qualified_enquiry_created' ELSE NEW.event END,NEW.lead_id,h.university,h.source,h.medium,h.campaign,NEW.lead_id::text||':'||NEW.event)
 ON CONFLICT(dedupe_key) DO NOTHING;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.houseplug_record_lead_event() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER houseplug_record_lead_event AFTER INSERT ON public.lead_events FOR EACH ROW EXECUTE FUNCTION public.houseplug_record_lead_event();
REVOKE UPDATE,DELETE ON public.lead_events FROM service_role;
CREATE POLICY published_current_inventory ON public.listings AS RESTRICTIVE FOR SELECT TO anon,authenticated
USING(landlord_id=(select auth.uid()) OR (select public.is_admin()) OR (status='active' AND availability_state='active' AND last_confirmed_at<=now() AND availability_expires_at>now()));

CREATE OR REPLACE FUNCTION public.claim_housing_outbox(batch_size integer DEFAULT 20)
RETURNS SETOF public.notification_outbox LANGUAGE sql SECURITY INVOKER SET search_path=pg_catalog,public,pg_temp AS $$
 UPDATE public.notification_outbox o SET status='processing',attempts=attempts+1,next_attempt_at=now()+interval '10 minutes'
 WHERE id IN(SELECT id FROM public.notification_outbox WHERE attempts<5 AND next_attempt_at<=now() AND status IN ('pending','retry','processing') ORDER BY created_at LIMIT least(50,greatest(1,batch_size)) FOR UPDATE SKIP LOCKED) RETURNING o.*;
$$;
REVOKE ALL ON FUNCTION public.claim_housing_outbox(integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.claim_housing_outbox(integer) TO service_role;
CREATE OR REPLACE FUNCTION public.housing_maintenance(retention_days integer DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public,houseplug_private,pg_temp AS $$
DECLARE expired integer;redacted integer:=0;
BEGIN
 UPDATE public.listings SET availability_state='expired' WHERE availability_state='active' AND availability_expires_at<=now();GET DIAGNOSTICS expired=ROW_COUNT;
 UPDATE public.roommate_profiles SET status='paused' WHERE status='active' AND expires_at<=now();
 DELETE FROM houseplug_private.request_limits WHERE created_at<now()-interval '1 day';
 IF retention_days IS NOT NULL AND retention_days>=1 AND retention_days<=3650 THEN
  UPDATE public.housing_requests SET contact_name='Removed under retention policy',contact_phone='',contact_email=NULL,fingerprint='redacted:'||id::text,user_id=NULL
  WHERE status IN ('cancelled','closed_unmatched','rented','spam') AND updated_at<now()-make_interval(days=>retention_days) AND contact_phone<>'';
  GET DIAGNOSTICS redacted=ROW_COUNT;
  DELETE FROM public.funnel_events WHERE created_at<now()-make_interval(days=>retention_days);
 END IF;
 RETURN jsonb_build_object('expired',expired,'redacted',redacted);
END $$;
REVOKE ALL ON FUNCTION public.housing_maintenance(integer) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.housing_maintenance(integer) TO service_role;
CREATE TABLE public.supplier_reviews (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),service_id uuid NOT NULL REFERENCES public.service_providers(id),reviewer_id uuid NOT NULL REFERENCES public.profiles(id),
 approved boolean NOT NULL,evidence_reference text NOT NULL,reviewed_at timestamptz NOT NULL DEFAULT now(),expires_at timestamptz
);
ALTER TABLE public.supplier_reviews ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.supplier_reviews FROM PUBLIC,anon,authenticated;
GRANT SELECT,INSERT ON public.supplier_reviews TO service_role;
CREATE OR REPLACE FUNCTION public.review_supplier(service_id uuid,reviewer_id uuid,payload jsonb) RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE expiry timestamptz:=now()+make_interval(days=>least(365,greatest(1,(payload->>'days')::integer)));
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=reviewer_id AND role IN ('admin','super_admin') AND NOT coalesce(banned,false) AND NOT coalesce(is_banned,false)) THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501';END IF;
 IF nullif(trim(payload->>'evidence_reference'),'') IS NULL THEN RAISE EXCEPTION 'Review evidence required';END IF;
 INSERT INTO public.supplier_reviews(service_id,reviewer_id,approved,evidence_reference,expires_at) VALUES(service_id,reviewer_id,(payload->>'approved')::boolean,payload->>'evidence_reference',expiry);
 UPDATE public.service_providers SET vetted_at=CASE WHEN (payload->>'approved')::boolean THEN now() ELSE NULL END,vetting_expires_at=CASE WHEN (payload->>'approved')::boolean THEN expiry ELSE NULL END,safety_requirements=payload->>'safety_requirements',service_hours=payload->>'service_hours' WHERE id=service_id;
END $$;
REVOKE ALL ON FUNCTION public.review_supplier(uuid,uuid,jsonb) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.review_supplier(uuid,uuid,jsonb) TO service_role;
CREATE OR REPLACE FUNCTION public.houseplug_guard_supplier() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
BEGIN
 IF current_user IN ('anon','authenticated') THEN
  IF TG_OP='INSERT' THEN NEW.vetted_at:=NULL;NEW.vetting_expires_at:=NULL;NEW.is_verified:=false;NEW.listing_paid:=false;NEW.is_boosted:=false;
  ELSIF ROW(NEW.user_id,NEW.vetted_at,NEW.vetting_expires_at,NEW.is_verified,NEW.listing_paid,NEW.listing_expires_at,NEW.is_boosted,NEW.boost_type,NEW.boost_expires_at) IS DISTINCT FROM ROW(OLD.user_id,OLD.vetted_at,OLD.vetting_expires_at,OLD.is_verified,OLD.listing_paid,OLD.listing_expires_at,OLD.is_boosted,OLD.boost_type,OLD.boost_expires_at) THEN RAISE EXCEPTION 'Trusted provider review or payment required' USING ERRCODE='42501';END IF;
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.houseplug_guard_supplier() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER houseplug_guard_supplier BEFORE INSERT OR UPDATE ON public.service_providers FOR EACH ROW EXECUTE FUNCTION public.houseplug_guard_supplier();
CREATE OR REPLACE FUNCTION public.houseplug_suspend_inventory() RETURNS trigger LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog AS $$
BEGIN
 IF coalesce(NEW.banned,false) OR coalesce(NEW.is_banned,false) THEN
  UPDATE public.listings SET status='unavailable',availability_state='paused' WHERE landlord_id=NEW.id AND status='active';
 END IF;
 RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.houseplug_suspend_inventory() FROM PUBLIC,anon,authenticated;
CREATE TRIGGER houseplug_suspend_inventory AFTER UPDATE OF banned,is_banned ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.houseplug_suspend_inventory();
CREATE OR REPLACE FUNCTION public.confirm_listing_availability(listing_id uuid,actor_id uuid,available boolean)
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE l public.listings;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=actor_id AND role IN ('landlord','agent') AND NOT coalesce(banned,false) AND NOT coalesce(is_banned,false)) THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501';END IF;
 SELECT * INTO l FROM public.listings WHERE id=listing_id FOR UPDATE;
 IF NOT FOUND OR l.landlord_id<>actor_id OR l.status NOT IN ('active','unavailable') THEN RAISE EXCEPTION 'Approved owner listing required' USING ERRCODE='42501';END IF;
 UPDATE public.listings SET status=CASE WHEN available THEN 'active' ELSE 'unavailable' END,availability_state=CASE WHEN available THEN 'active' ELSE 'paused' END,last_confirmed_at=CASE WHEN available THEN now() ELSE last_confirmed_at END,availability_expires_at=CASE WHEN available THEN now()+interval '14 days' ELSE now() END WHERE id=l.id;
 INSERT INTO public.verification_evidence(listing_id,dimension,checked_at,expires_at,reviewer_id,evidence_pointer)
 VALUES(l.id,'availability_confirmed',now(),now()+interval '14 days',actor_id,CASE WHEN available THEN 'Advertiser self-confirmed availability in dashboard' ELSE 'Advertiser marked property unavailable' END);
END $$;
REVOKE ALL ON FUNCTION public.confirm_listing_availability(uuid,uuid,boolean) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.confirm_listing_availability(uuid,uuid,boolean) TO service_role;
CREATE TABLE public.housing_request_matches(
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),lead_id uuid NOT NULL REFERENCES public.housing_requests(id) ON DELETE CASCADE,
 listing_id uuid REFERENCES public.listings(id) ON DELETE SET NULL,matched_by uuid NOT NULL REFERENCES public.profiles(id),created_at timestamptz NOT NULL DEFAULT now(),archived_at timestamptz
);
CREATE INDEX request_match_current ON public.housing_request_matches(lead_id) WHERE archived_at IS NULL;
ALTER TABLE public.housing_request_matches ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.housing_request_matches FROM PUBLIC,anon,authenticated;
GRANT ALL ON public.housing_request_matches TO service_role;
GRANT SELECT ON public.housing_request_matches TO authenticated;
CREATE POLICY own_request_matches ON public.housing_request_matches FOR SELECT TO authenticated USING(EXISTS(SELECT 1 FROM public.housing_requests h WHERE h.id=lead_id AND (h.user_id=(select auth.uid()) OR h.assigned_agent_id=(select auth.uid()) OR (select public.is_admin()))));
CREATE OR REPLACE FUNCTION public.suggest_housing_options(request_id uuid,actor_id uuid,listing_ids uuid[])
RETURNS void LANGUAGE plpgsql SECURITY INVOKER SET search_path=pg_catalog,public,pg_temp AS $$
DECLARE h public.housing_requests;n integer;
BEGIN
 IF NOT EXISTS(SELECT 1 FROM public.profiles WHERE id=actor_id AND role IN ('admin','super_admin') AND NOT coalesce(banned,false) AND NOT coalesce(is_banned,false)) THEN RAISE EXCEPTION 'Forbidden' USING ERRCODE='42501';END IF;
 SELECT * INTO h FROM public.housing_requests WHERE id=request_id FOR UPDATE;
 IF NOT FOUND OR h.status NOT IN ('qualified','matching') THEN RAISE EXCEPTION 'Qualified request required';END IF;
 IF listing_ids IS NULL OR cardinality(listing_ids)<1 OR cardinality(listing_ids)>3 THEN RAISE EXCEPTION 'Choose up to three real rooms';END IF;
 SELECT count(*) INTO n FROM public.listings l WHERE l.id=ANY(listing_ids) AND l.status='active' AND l.availability_state='active' AND l.availability_expires_at>now() AND l.last_confirmed_at<=now() AND l.last_confirmed_at IS NOT NULL AND l.university=h.university AND l.total_initial_payment<=h.total_budget AND EXISTS(SELECT 1 FROM public.profiles p WHERE p.id=l.landlord_id AND NOT coalesce(p.banned,false) AND NOT coalesce(p.is_banned,false));
 IF n<>cardinality(listing_ids) THEN RAISE EXCEPTION 'Options must be current and within the confirmed total budget';END IF;
 UPDATE public.housing_request_matches SET archived_at=now() WHERE lead_id=h.id AND archived_at IS NULL;
 INSERT INTO public.housing_request_matches(lead_id,listing_id,matched_by) SELECT h.id,unnest(listing_ids),actor_id;
 UPDATE public.housing_requests SET status='matching',updated_at=now() WHERE id=h.id;
 INSERT INTO public.lead_events(lead_id,actor_id,event,previous_status,next_status) VALUES(h.id,actor_id,'housing_options_suggested',h.status,'matching');
END $$;
REVOKE ALL ON FUNCTION public.suggest_housing_options(uuid,uuid,uuid[]) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.suggest_housing_options(uuid,uuid,uuid[]) TO service_role;

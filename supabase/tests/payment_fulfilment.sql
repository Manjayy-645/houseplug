BEGIN;
DO $$
DECLARE ref text:=gen_random_uuid()::text;a timestamptz;b timestamptz;
BEGIN
 INSERT INTO public.payments(paystack_reference,type,amount,status) VALUES(ref,'subscription',500000,'pending');
 PERFORM set_config('role','service_role',true);
 a:=public.claim_payment_fulfilment(ref);IF a IS NULL THEN RAISE EXCEPTION 'Could not claim new payment';END IF;
 b:=public.claim_payment_fulfilment(ref);IF b IS NOT NULL THEN RAISE EXCEPTION 'Duplicate worker claimed payment';END IF;
 UPDATE public.payments SET fulfilment_status='failed',status='success' WHERE paystack_reference=ref;
 b:=public.claim_payment_fulfilment(ref);IF b IS DISTINCT FROM a THEN RAISE EXCEPTION 'Recovery changed entitlement anchor';END IF;
 UPDATE public.payments SET fulfilment_status='fulfilled' WHERE paystack_reference=ref;
 IF public.claim_payment_fulfilment(ref) IS NOT NULL THEN RAISE EXCEPTION 'Completed payment reprocessed';END IF;
 INSERT INTO public.payments(paystack_reference,type,amount,status) VALUES(ref||'-legacy','subscription',500000,'success');
 IF public.claim_payment_fulfilment(ref||'-legacy') IS NOT NULL THEN RAISE EXCEPTION 'Historical success automatically replayed';END IF;
 PERFORM set_config('role','postgres',true);
END $$;
ROLLBACK;

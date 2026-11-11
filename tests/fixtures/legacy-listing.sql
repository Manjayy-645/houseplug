-- Synthetic historical listing; applied before the housing migration.
INSERT INTO auth.users(id,email,raw_app_meta_data)
VALUES('11111111-1111-4111-8111-111111111111','legacy-owner@example.invalid','{"provider":"google"}'::jsonb);
INSERT INTO public.profiles(id,email,full_name,role)
VALUES('11111111-1111-4111-8111-111111111111','legacy-owner@example.invalid','Legacy owner','landlord');
INSERT INTO public.listings(id,landlord_id,price_yearly,status,agent_fee_type,agent_fee_amount,whatsapp_number,created_at)
VALUES('22222222-2222-4222-8222-222222222222','11111111-1111-4111-8111-111111111111',85000,'active','negotiable',NULL,'08012345678','2026-06-17T08:42:05Z');

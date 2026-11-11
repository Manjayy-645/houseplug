INSERT INTO auth.users(id,email,raw_app_meta_data) VALUES('10000000-0000-4000-8000-000000000001','student@example.invalid','{"provider":"google"}'),('10000000-0000-4000-8000-000000000002','other@example.invalid','{"provider":"google"}'),('10000000-0000-4000-8000-000000000003','agent@example.invalid','{"provider":"google"}'),('10000000-0000-4000-8000-000000000004','admin@example.invalid','{"provider":"google"}');
INSERT INTO public.profiles(id,email,full_name,role) VALUES('10000000-0000-4000-8000-000000000001','student@example.invalid','Test Student','student'),('10000000-0000-4000-8000-000000000002','other@example.invalid','Other Student','student'),('10000000-0000-4000-8000-000000000003','agent@example.invalid','Test Agent','agent'),('10000000-0000-4000-8000-000000000004','admin@example.invalid','Test Administrator','super_admin');
INSERT INTO public.listings(id,landlord_id,title,price_yearly,area,address,status,availability_state,last_confirmed_at,availability_expires_at,fee_items,fees_complete,media_confirmed_at,authority_checked_at,evidence_expires_at,photos,whatsapp_number)
VALUES('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000003','Test fixture room',250000,'Aluu','Private fixture address','active','active',now(),now()+interval '14 days','[{"type":"agency","label":"Agency fee","amount":150000,"mandatory":true,"refundable":false}]',true,now(),now(),now()+interval '90 days','{/hero-student-housing.jpg}','08012345678');
-- Public listing contacts differ from private account contacts.
UPDATE public.profiles SET phone='08087654321' WHERE id='10000000-0000-4000-8000-000000000003';
INSERT INTO public.listings(id,landlord_id,title,price_yearly,area,status,availability_state,last_confirmed_at,availability_expires_at,whatsapp_number)
VALUES('20000000-0000-4000-8000-000000000002','10000000-0000-4000-8000-000000000003','Private draft fixture',250000,'Aluu','pending','pending_review',now(),now()+interval '14 days','08087654321'),
('20000000-0000-4000-8000-000000000003','10000000-0000-4000-8000-000000000003','Missing WhatsApp fixture',250000,'Aluu','active','active',now(),now()+interval '14 days',''),
('20000000-0000-4000-8000-000000000004','10000000-0000-4000-8000-000000000003','Expired fixture',250000,'Aluu','active','active',now()-interval '30 days',now()-interval '1 day','08087654321');
GRANT SELECT,INSERT ON public.activity_events TO anon,authenticated,service_role;
INSERT INTO public.listings(id,landlord_id,title,price_yearly,area,status,availability_state,legacy_inventory,whatsapp_number)
VALUES('20000000-0000-4000-8000-000000000005','10000000-0000-4000-8000-000000000003','Legacy room with recorded rent',85000,'Aluu','active','active',true,'08012345678');
NOTIFY pgrst,'reload schema';

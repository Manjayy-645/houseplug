-- Synthetic equivalent of the public QA room for the last-known-good design.
-- Legacy schema only, isolated container; never used on production.
INSERT INTO auth.users(id,email) VALUES('10000000-0000-4000-8000-000000000003','agent@example.invalid');
INSERT INTO public.profiles(id,email,full_name,role) VALUES('10000000-0000-4000-8000-000000000003','agent@example.invalid','Test Agent','agent');
INSERT INTO public.listings(id,landlord_id,title,price_yearly,area,address,status,photos,whatsapp_number,occupancy,agent_fee_type,agent_fee_amount)
VALUES('20000000-0000-4000-8000-000000000001','10000000-0000-4000-8000-000000000003','Test fixture room',250000,'Aluu','Fixture neighbourhood','active','{/hero-student-housing.jpg}','08012345678',1,'fixed',150000);
GRANT SELECT,INSERT ON public.activity_events TO anon,authenticated,service_role;
NOTIFY pgrst,'reload schema';

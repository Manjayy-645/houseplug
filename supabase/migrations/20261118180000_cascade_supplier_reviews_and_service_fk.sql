-- Migration: Add ON DELETE CASCADE to supplier_reviews and service_requests foreign keys
-- Fixes: "update or delete on table "service_providers" violates foreign key constraint "supplier_reviews_service_id_fkey" on table "supplier_reviews""

DO $$
BEGIN
  -- 1. supplier_reviews -> service_providers(id) ON DELETE CASCADE
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'supplier_reviews_service_id_fkey'
      AND table_schema = 'public'
      AND table_name = 'supplier_reviews'
  ) THEN
    ALTER TABLE public.supplier_reviews DROP CONSTRAINT supplier_reviews_service_id_fkey;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'supplier_reviews'
  ) THEN
    ALTER TABLE public.supplier_reviews
      ADD CONSTRAINT supplier_reviews_service_id_fkey
      FOREIGN KEY (service_id)
      REFERENCES public.service_providers(id)
      ON DELETE CASCADE;
  END IF;

  -- 2. service_requests -> service_providers(id) ON DELETE CASCADE
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'service_requests_provider_id_fkey'
      AND table_schema = 'public'
      AND table_name = 'service_requests'
  ) THEN
    ALTER TABLE public.service_requests DROP CONSTRAINT service_requests_provider_id_fkey;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'service_requests'
  ) THEN
    ALTER TABLE public.service_requests
      ADD CONSTRAINT service_requests_provider_id_fkey
      FOREIGN KEY (provider_id)
      REFERENCES public.service_providers(id)
      ON DELETE CASCADE;
  END IF;

  -- 3. reports -> service_providers(id) ON DELETE SET NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'reports_service_id_fkey'
      AND table_schema = 'public'
      AND table_name = 'reports'
  ) THEN
    ALTER TABLE public.reports DROP CONSTRAINT reports_service_id_fkey;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'reports'
  ) THEN
    ALTER TABLE public.reports
      ADD CONSTRAINT reports_service_id_fkey
      FOREIGN KEY (service_id)
      REFERENCES public.service_providers(id)
      ON DELETE SET NULL;
  END IF;

  -- 4. payments -> service_providers(id) ON DELETE SET NULL
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'payments_service_id_fkey'
      AND table_schema = 'public'
      AND table_name = 'payments'
  ) THEN
    ALTER TABLE public.payments DROP CONSTRAINT payments_service_id_fkey;
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'payments'
  ) THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_service_id_fkey
      FOREIGN KEY (service_id)
      REFERENCES public.service_providers(id)
      ON DELETE SET NULL;
  END IF;

END $$;

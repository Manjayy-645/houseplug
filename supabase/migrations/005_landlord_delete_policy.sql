-- Add DELETE policy for landlords to delete their own listings
DO $$ BEGIN
  CREATE POLICY "Landlords can delete own listings" ON public.listings
    FOR DELETE TO authenticated USING (auth.uid() = landlord_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

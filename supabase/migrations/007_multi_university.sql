-- Add university column to listings table
ALTER TABLE listings
ADD COLUMN IF NOT EXISTS university TEXT DEFAULT 'uniport';

-- Update existing listings to have 'uniport' as the university if it's null
UPDATE listings SET university = 'uniport' WHERE university IS NULL;

-- Update reviews table schema
ALTER TABLE reviews
DROP COLUMN IF EXISTS student_id,
DROP COLUMN IF EXISTS comment,
ADD COLUMN IF NOT EXISTS reviewer_name text DEFAULT 'UniPort Student',
ADD COLUMN IF NOT EXISTS review_text text;

-- Drop existing policies if they rely on student_id
DROP POLICY IF EXISTS "Students can insert their own reviews" ON reviews;
DROP POLICY IF EXISTS "Students can delete their own reviews" ON reviews;
DROP POLICY IF EXISTS "Anyone can insert reviews" ON reviews;

-- Enable RLS and add open policies as requested
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read reviews" ON reviews FOR SELECT USING (true);
CREATE POLICY "Anyone can insert reviews" ON reviews FOR INSERT WITH CHECK (true);

-- Update symptoms table to MSQ (Medical Symptoms Questionnaire) structure
-- This migration transforms the existing symptoms table to support MSQ-based tracking

-- First, add new MSQ-specific columns
ALTER TABLE public.symptoms 
  ADD COLUMN symptom_id TEXT,           -- MSQ symptom ID (e.g., 'head_headaches')
  ADD COLUMN category TEXT,             -- MSQ category (e.g., 'Head')
  ADD COLUMN score INTEGER CHECK (score >= 0 AND score <= 4); -- MSQ 0-4 scale

-- Update the name column to be consistent with MSQ symptom names
-- (keeping existing NOT NULL constraint)

-- Drop the old severity column (1-5 scale) 
-- Note: Since no production data exists, this is safe
ALTER TABLE public.symptoms DROP COLUMN severity;

-- Make new columns required after they exist
ALTER TABLE public.symptoms 
  ALTER COLUMN symptom_id SET NOT NULL,
  ALTER COLUMN category SET NOT NULL,
  ALTER COLUMN score SET NOT NULL;

-- Add indexes for better query performance
CREATE INDEX idx_symptoms_symptom_id ON public.symptoms(symptom_id);
CREATE INDEX idx_symptoms_category ON public.symptoms(category);
CREATE INDEX idx_symptoms_score ON public.symptoms(score);

-- Update existing index to include new columns for compound queries
DROP INDEX IF EXISTS idx_symptoms_user_id_timestamp;
CREATE INDEX idx_symptoms_user_timestamp_category ON public.symptoms(user_id, timestamp DESC, category);

-- Add comment to document the MSQ scale
COMMENT ON COLUMN public.symptoms.score IS 'MSQ scale: 0=Never, 1=Occasional/mild, 2=Occasional/severe, 3=Frequent/mild, 4=Frequent/severe';
COMMENT ON COLUMN public.symptoms.symptom_id IS 'MSQ symptom identifier from symptom index (e.g., head_headaches)';
COMMENT ON COLUMN public.symptoms.category IS 'MSQ category name (e.g., Head, Eyes, Digestive Tract)';

-- Update the updated_at trigger (should still work, but let's make sure)
-- The trigger function should already exist from initial schema
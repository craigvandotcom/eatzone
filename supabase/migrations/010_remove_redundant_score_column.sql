-- Migration: Remove redundant score column from symptoms table
-- Since existence of a symptom entry implies presence, score field is unnecessary

-- Drop the score column entirely
ALTER TABLE public.symptoms DROP COLUMN IF EXISTS score;

-- Update table comment to reflect the simplified approach
COMMENT ON TABLE public.symptoms IS 'Simplified symptom tracking with 4 categories - symptom presence indicated by entry existence';

-- Migration: New simplified symptom categories with delta rating scale
-- Replaces MSQ system with 4-category system and -2 to +2 delta scale
-- Safe to drop existing data as confirmed by user

-- Drop existing symptoms table (no production data to preserve)
DROP TABLE IF EXISTS public.symptoms CASCADE;

-- Create new symptoms table with simplified structure
CREATE TABLE public.symptoms (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    symptom_id TEXT NOT NULL,           -- Simple symptom ID (e.g., 'nausea', 'fatigue')
    category TEXT NOT NULL,             -- One of: 'digestion', 'energy', 'mind', 'recovery'
    name TEXT NOT NULL,                 -- Human-readable symptom name
    score INTEGER NOT NULL CHECK (score >= -2 AND score <= 2), -- Delta scale: -2 much worse, -1 worse, 0 baseline, +1 better, +2 much better
    timestamp TIMESTAMPTZ NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX idx_symptoms_user_id_timestamp ON public.symptoms(user_id, timestamp DESC);
CREATE INDEX idx_symptoms_symptom_id ON public.symptoms(symptom_id);
CREATE INDEX idx_symptoms_category ON public.symptoms(category);
CREATE INDEX idx_symptoms_score ON public.symptoms(score);
CREATE INDEX idx_symptoms_user_timestamp_category ON public.symptoms(user_id, timestamp DESC, category);

-- Add comments to document the new system
COMMENT ON COLUMN public.symptoms.score IS 'Delta scale: -2=much worse, -1=worse, 0=baseline, +1=better, +2=much better';
COMMENT ON COLUMN public.symptoms.symptom_id IS 'Simplified symptom identifier (e.g., nausea, fatigue, brain_fog_confusion)';
COMMENT ON COLUMN public.symptoms.category IS 'Symptom category: digestion, energy, mind, or recovery';
COMMENT ON TABLE public.symptoms IS 'Simplified symptom tracking with 4 categories and delta rating scale for nutrition testing';

-- Enable Row Level Security
ALTER TABLE public.symptoms ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (same as before)
CREATE POLICY "Users can view own symptoms" ON public.symptoms
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own symptoms" ON public.symptoms
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own symptoms" ON public.symptoms
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own symptoms" ON public.symptoms
    FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_symptoms_updated_at BEFORE UPDATE ON public.symptoms
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

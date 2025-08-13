-- Add retry tracking columns to foods table
-- This enables proper retry limit handling for background zoning

-- Add retry tracking columns
ALTER TABLE public.foods 
ADD COLUMN retry_count INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN last_retry_at TIMESTAMPTZ;

-- Add index for retry tracking queries (only index rows that have retries)
CREATE INDEX idx_foods_retry_tracking ON public.foods(retry_count, last_retry_at) 
WHERE retry_count > 0;

-- Add comments for documentation
COMMENT ON COLUMN public.foods.retry_count IS 'Number of retry attempts for background zoning';
COMMENT ON COLUMN public.foods.last_retry_at IS 'Timestamp of last retry attempt';
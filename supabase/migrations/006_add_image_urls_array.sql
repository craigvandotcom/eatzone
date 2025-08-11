-- Migration: Add image_urls array for multi-image support
-- This maintains backward compatibility while enabling multiple images per food entry

-- Add new column for storing multiple image URLs
ALTER TABLE public.foods 
ADD COLUMN image_urls TEXT[] DEFAULT ARRAY[]::TEXT[];

-- Create index for efficient querying of entries with images
CREATE INDEX idx_foods_image_urls ON public.foods USING GIN (image_urls);

-- Migrate existing photo_url data to new array column
-- This preserves all existing images in the new structure
UPDATE public.foods 
SET image_urls = ARRAY[photo_url] 
WHERE photo_url IS NOT NULL AND photo_url != '';

-- Add comment for documentation
COMMENT ON COLUMN public.foods.image_urls IS 'Array of image URLs for multi-angle food photos. Supports training data extraction.';

-- Note: We're keeping photo_url column for backward compatibility
-- It will store the primary image for legacy code paths
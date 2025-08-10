-- ============================================
-- SUPABASE STORAGE BUCKET SETUP - MANUAL STEPS
-- ============================================

-- IMPORTANT: Bucket creation and RLS policies must be done through the Supabase Dashboard
-- The SQL Editor doesn't have permissions to modify storage.objects directly

-- ============================================
-- STEP 1: CREATE BUCKET (In Supabase Dashboard)
-- ============================================
-- 1. Go to Storage in your Supabase Dashboard
-- 2. Click "New bucket"
-- 3. Configure:
--    - Name: food-images
--    - Public bucket: ON (toggle to enable)
--    - File size limit: 10MB
--    - Allowed MIME types: image/jpeg,image/png,image/webp
-- 4. Click "Create"

-- ============================================
-- STEP 2: SET UP RLS POLICIES (In Storage Dashboard)
-- ============================================
-- 1. After creating the bucket, click on it
-- 2. Go to the "Policies" tab
-- 3. Click "New policy" and select "For full customization"
-- 4. Create each policy below:

-- POLICY 1: Upload - Users can upload to their folder
-- Name: Users can upload own images
-- Allowed operation: INSERT
-- Target roles: authenticated
-- WITH CHECK expression:
-- (bucket_id = 'food-images' AND auth.uid()::text = (storage.foldername(name))[1])

-- POLICY 2: View - Users can view their own images
-- Name: Users can view own images  
-- Allowed operation: SELECT
-- Target roles: authenticated
-- USING expression:
-- (bucket_id = 'food-images' AND auth.uid()::text = (storage.foldername(name))[1])

-- POLICY 3: Update - Users can update their own images
-- Name: Users can update own images
-- Allowed operation: UPDATE
-- Target roles: authenticated
-- USING expression:
-- (bucket_id = 'food-images' AND auth.uid()::text = (storage.foldername(name))[1])

-- POLICY 4: Delete - Users can delete their own images
-- Name: Users can delete own images
-- Allowed operation: DELETE
-- Target roles: authenticated
-- USING expression:
-- (bucket_id = 'food-images' AND auth.uid()::text = (storage.foldername(name))[1])

-- POLICY 5: Public Read - Allow authenticated users to view all images
-- Name: Public read for authenticated users
-- Allowed operation: SELECT
-- Target roles: authenticated
-- USING expression:
-- (bucket_id = 'food-images')

-- ============================================
-- STEP 3: VERIFY SETUP (Run this in SQL Editor)
-- ============================================

-- Check if bucket exists
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
FROM storage.buckets
WHERE name = 'food-images';

-- If the above query returns a row, your bucket is created!
-- If it returns no rows, go back to Step 1

-- Check RLS policies (may need to be done after policies are created)
SELECT 
  policyname,
  cmd,
  roles
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%image%'
ORDER BY policyname;
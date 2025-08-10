# Supabase Storage Setup Instructions

## Prerequisites

- Access to Supabase Dashboard
- Project already configured with authentication

## Step 1: Create Storage Bucket

1. Go to your Supabase Dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **Create Bucket**
4. Configure as follows:
   - **Name**: `food-images`
   - **Public**: Yes (we'll use RLS policies for security)
   - **File size limit**: 10MB (reasonable for optimized images)
   - **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`

## Step 2: Apply RLS Policies

Run the following SQL in the Supabase SQL Editor:

```sql
-- Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Policy: Users can upload images to their own folder
CREATE POLICY "Users can upload own images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'food-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can view their own images
CREATE POLICY "Users can view own images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'food-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can update their own images
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'food-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy: Users can delete their own images
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'food-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Public access for viewing (authenticated users only)
CREATE POLICY "Authenticated users can view food images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'food-images' AND
  auth.role() = 'authenticated'
);
```

## Step 3: Verify Setup

1. Test upload with a sample image through the app
2. Check that the image URL is accessible
3. Verify that users can only access their own images

## Storage Structure

Images will be organized as follows:

```
food-images/
├── {user_id}/
│   └── foods/
│       ├── {food_id}_1.jpg    # Primary image
│       ├── {food_id}_2.jpg    # Additional image
│       └── {food_id}_3.jpg    # Additional image
```

## Important Notes

- Images are automatically optimized to 800px max dimension
- JPEG quality is set to 75% for balance of quality and size
- Each food entry can have up to 3 images
- Food ID prefix ensures easy matching with ingredient data

## Troubleshooting

If uploads fail:

1. Check that the bucket exists and is named `food-images`
2. Verify RLS policies are applied
3. Ensure user is authenticated
4. Check Supabase logs for specific errors

## Testing Commands

```bash
# Test bucket access (run in app)
pnpm test:real

# Check storage status
curl -X GET https://YOUR_PROJECT_URL/storage/v1/bucket/food-images \
  -H "apikey: YOUR_ANON_KEY"
```

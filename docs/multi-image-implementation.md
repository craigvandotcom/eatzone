# Multi-Image Support Implementation

## Overview

This document describes the multi-image support implementation for food entries, designed to improve AI analysis accuracy while maintaining backward compatibility and preparing for future model fine-tuning.

## Architecture

### Database Schema

```sql
-- Existing column (maintained for backward compatibility)
photo_url TEXT

-- New column for multi-image support
image_urls TEXT[]  -- Array of image URLs, includes primary image
```

### Storage Structure

```
food-images/
├── {user_id}/
│   └── foods/
│       ├── {food_id}_1.jpg    # Primary image
│       ├── {food_id}_2.jpg    # Additional angle
│       └── {food_id}_3.jpg    # Additional angle
```

Using `food_id` as prefix ensures:

- Easy matching of images to ingredients for training data
- Logical grouping of related images
- Simple cleanup when deleting entries

## Components

### 1. Multi-Camera Capture (`/features/camera/components/multi-camera-capture.tsx`)

- Supports capturing up to 3 images (configurable)
- Shows thumbnails of captured images
- Allows removal and re-capture
- Supports file upload for multiple images
- Mobile-optimized UI with clear visual feedback

### 2. Image Storage (`/lib/image-storage.ts`)

- `uploadFoodImages()`: Parallel upload of multiple images
- `uploadSingleImage()`: Individual image upload with indexing
- Maintains backward compatibility with single image upload
- Automatic image optimization (800px max, 75% JPEG quality)

### 3. API Enhancement (`/app/api/analyze-image/route.ts`)

- Accepts both single `image` and multiple `images[]`
- Sends all images in single OpenRouter request
- Better context for AI analysis
- Cost-effective (one API call vs multiple)

### 4. Database Functions (`/lib/db.ts`)

- Pre-generates food ID for consistent image naming
- Handles both single and multiple image uploads
- Stores in both `photo_url` (primary) and `image_urls[]` (all)
- Graceful degradation if image upload fails

## Usage

### Single Image (Backward Compatible)

```typescript
await addFood({
  name: "Lunch",
  image: base64Image,
  ingredients: [...],
  // ...
});
```

### Multiple Images (New)

```typescript
await addFood({
  name: "Lunch",
  images: [base64Image1, base64Image2, base64Image3],
  ingredients: [...],
  // ...
});
```

### API Request Format

```typescript
// Single image
POST /api/analyze-image
{
  "image": "data:image/jpeg;base64,..."
}

// Multiple images
POST /api/analyze-image
{
  "images": [
    "data:image/jpeg;base64,...",
    "data:image/jpeg;base64,...",
    "data:image/jpeg;base64,..."
  ]
}
```

## Training Data Export (Future)

When ready to export training data:

```sql
SELECT
  f.id,
  f.image_urls,
  f.ingredients  -- Final user-corrected ingredients
FROM foods f
WHERE f.image_urls IS NOT NULL
  AND array_length(f.image_urls, 1) > 0
  AND f.timestamp > '2025-01-01';
```

This gives us:

- All images for each food entry
- Final ingredient list (after user corrections)
- Direct association via food ID
- Easy filtering by date range

## Migration Path

### Phase 1: Current Implementation ✅

- Multi-image capture UI
- Parallel image upload
- Enhanced API analysis
- Backward compatible storage

### Phase 2: UI Integration (Next)

- Update food entry form to use MultiCameraCapture
- Display image carousel in food history
- Add swipe gestures for image navigation

### Phase 3: Training Pipeline (Future)

- Export script for training data
- Image-ingredient pairing
- Metadata inclusion (device, app version)
- Quality metrics tracking

## Testing

### Manual Testing Checklist

1. ✅ Single image upload still works
2. ✅ Multiple images upload successfully
3. ✅ API accepts both formats
4. ✅ Images stored with correct naming
5. ✅ Database stores both photo_url and image_urls
6. ✅ Failed uploads don't break entry creation

### Automated Tests

- Run existing tests: `pnpm test`
- Type checking: `pnpm type-check` ✅
- Linting: `pnpm lint` ✅

## Performance Considerations

- **Parallel uploads**: All images upload simultaneously
- **Image optimization**: 800px max, 75% quality
- **API efficiency**: Single request for all images
- **Storage efficiency**: ~100-200KB per image
- **Limit**: 3 images per entry (configurable)

## Security

- RLS policies ensure users can only access their own images
- Image paths include user ID for additional validation
- Rate limiting on API endpoint (10 requests/minute)
- Maximum 5 images per API request

## Next Steps

1. **Set up Supabase Storage**:
   - Create 'food-images' bucket
   - Apply RLS policies from `/supabase/storage-setup.md`
   - Test upload functionality

2. **Integrate UI**:
   - Replace CameraCapture with MultiCameraCapture in food form
   - Add image carousel to entry display
   - Update edit functionality

3. **Monitor & Optimize**:
   - Track multi-image usage
   - Measure accuracy improvements
   - Optimize based on user feedback

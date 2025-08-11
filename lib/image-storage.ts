import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/utils/logger';

// Image configuration constants
export const IMAGE_CONFIG = {
  maxSize: 800, // 800px max dimension
  quality: 0.75, // 75% JPEG quality
  format: 'image/jpeg' as const,
} as const;

// Get Supabase client
const supabase = createClient();

/**
 * Convert base64 image data to a File object with resizing
 * @param base64Data - Base64 image data (with or without data: prefix)
 * @param filename - Desired filename
 * @returns Promise<File> - Resized image file
 */
export async function base64ToFile(
  base64Data: string,
  filename: string
): Promise<File> {
  return new Promise((resolve, reject) => {
    // Remove data URL prefix if present
    const base64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');

    // Convert base64 to blob
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });

    // Create image element for resizing
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img;
      const maxSize = IMAGE_CONFIG.maxSize;

      if (width > maxSize || height > maxSize) {
        if (width > height) {
          height = (height * maxSize) / width;
          width = maxSize;
        } else {
          width = (width * maxSize) / height;
          height = maxSize;
        }
      }

      // Set canvas size and draw resized image
      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // Convert canvas to blob with compression
      canvas.toBlob(
        resizedBlob => {
          if (resizedBlob) {
            const file = new File([resizedBlob], filename, {
              type: IMAGE_CONFIG.format,
            });
            resolve(file);
          } else {
            reject(new Error('Failed to resize image'));
          }
        },
        IMAGE_CONFIG.format,
        IMAGE_CONFIG.quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(blob);
  });
}

/**
 * Generate a unique filename for food images
 * @param userId - User ID
 * @param foodId - Food entry ID for grouping related images
 * @param imageIndex - Index of image (1-based for readability)
 * @returns Unique filename with food ID and index
 */
export function generateImageFilename(
  userId: string,
  foodId: string,
  imageIndex: number = 1
): string {
  return `${userId}/foods/${foodId}_${imageIndex}.jpg`;
}

/**
 * Upload a single image to Supabase Storage
 * @param imageData - Base64 image data
 * @param userId - User ID for organizing files
 * @param foodId - Food entry ID
 * @param imageIndex - Index of the image (for multi-image support)
 * @returns Promise<string | null> - Public URL or null if failed
 */
export async function uploadSingleImage(
  imageData: string,
  userId: string,
  foodId: string,
  imageIndex: number = 1
): Promise<string | null> {
  try {
    // Generate unique filename with food ID and index
    const filename = generateImageFilename(userId, foodId, imageIndex);

    // Convert base64 to resized file
    const file = await base64ToFile(imageData, filename);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('food-images')
      .upload(filename, file, {
        cacheControl: '3600', // Cache for 1 hour
        upsert: false, // Don't overwrite existing files
      });

    if (error) {
      logger.error(`Image upload failed for index ${imageIndex}`, error);
      return null;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('food-images')
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } catch (error) {
    logger.error(`Image processing failed for index ${imageIndex}`, error);
    return null;
  }
}

/**
 * Upload image to Supabase Storage (backward compatible single image)
 * @param imageData - Base64 image data
 * @param userId - User ID for organizing files
 * @returns Promise<string | null> - Public URL or null if failed
 */
export async function uploadFoodImage(
  imageData: string,
  userId: string
): Promise<string | null> {
  // Generate a temporary food ID for backward compatibility
  const tempFoodId = new Date().toISOString().replace(/[:.]/g, '-');
  return uploadSingleImage(imageData, userId, tempFoodId, 1);
}

/**
 * Upload multiple images for a food entry
 * @param images - Array of base64 image data
 * @param userId - User ID for organizing files
 * @param foodId - Food entry ID to link images together
 * @returns Promise<string[]> - Array of public URLs (successful uploads only)
 */
export async function uploadFoodImages(
  images: string[],
  userId: string,
  foodId: string
): Promise<string[]> {
  if (images.length === 0) return [];

  // Upload all images in parallel for better performance
  const uploadPromises = images.map((image, index) =>
    uploadSingleImage(image, userId, foodId, index + 1)
  );

  const results = await Promise.allSettled(uploadPromises);

  // Filter out failed uploads and extract URLs
  const successfulUrls = results
    .filter(
      (result): result is PromiseFulfilledResult<string | null> =>
        result.status === 'fulfilled' && result.value !== null
    )
    .map(result => result.value as string);

  if (successfulUrls.length < images.length) {
    logger.warn(
      `Only ${successfulUrls.length} of ${images.length} images uploaded successfully`
    );
  }

  return successfulUrls;
}

/**
 * Delete image from Supabase Storage
 * @param imageUrl - Full public URL of the image
 * @returns Promise<boolean> - Success status
 */
export async function deleteFoodImage(imageUrl: string): Promise<boolean> {
  try {
    // Validate input URL
    if (!imageUrl || typeof imageUrl !== 'string') {
      logger.error('Invalid image URL provided for deletion', { imageUrl });
      return false;
    }

    // Extract path from public URL with proper error handling
    let url: URL;
    let pathSegments: string[];
    let filename: string;

    try {
      url = new URL(imageUrl);
      pathSegments = url.pathname.split('/');
      filename = pathSegments.slice(-3).join('/'); // Get last 3 segments: userId/foods/filename.jpg

      // Validate that we extracted a reasonable filename
      if (!filename || filename.length < 5 || !filename.includes('/')) {
        throw new Error(`Invalid filename extracted: ${filename}`);
      }
    } catch (urlError) {
      logger.error('Failed to parse image URL for deletion', urlError, {
        imageUrl: imageUrl.substring(0, 100), // Log first 100 chars for debugging
      });
      return false;
    }

    const { error } = await supabase.storage
      .from('food-images')
      .remove([filename]);

    if (error) {
      logger.error('Image deletion failed', error, { filename });
      return false;
    }

    logger.debug('Image deleted successfully', { filename });
    return true;
  } catch (error) {
    logger.error('Image deletion processing failed', error, {
      imageUrl: imageUrl?.substring(0, 100),
    });
    return false;
  }
}

/**
 * Delete multiple images from Supabase Storage
 * @param imageUrls - Array of public URLs to delete
 * @returns Promise<number> - Number of successfully deleted images
 */
export async function deleteFoodImages(imageUrls: string[]): Promise<number> {
  if (imageUrls.length === 0) return 0;

  const deletePromises = imageUrls.map(url => deleteFoodImage(url));
  const results = await Promise.allSettled(deletePromises);

  const successCount = results.filter(
    result => result.status === 'fulfilled' && result.value === true
  ).length;

  if (successCount < imageUrls.length) {
    logger.warn(
      `Only ${successCount} of ${imageUrls.length} images deleted successfully`
    );
  }

  return successCount;
}

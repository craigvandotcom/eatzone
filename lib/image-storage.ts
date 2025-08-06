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
 * @returns Unique filename with timestamp
 */
export function generateImageFilename(userId: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${userId}/foods/${timestamp}.jpg`;
}

/**
 * Upload image to Supabase Storage
 * @param imageData - Base64 image data
 * @param userId - User ID for organizing files
 * @returns Promise<string | null> - Public URL or null if failed
 */
export async function uploadFoodImage(
  imageData: string,
  userId: string
): Promise<string | null> {
  try {
    // Generate unique filename
    const filename = generateImageFilename(userId);

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
      logger.error('Image upload failed', error);
      return null;
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('food-images')
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  } catch (error) {
    logger.error('Image processing failed', error);
    return null;
  }
}

/**
 * Delete image from Supabase Storage
 * @param imageUrl - Full public URL of the image
 * @returns Promise<boolean> - Success status
 */
export async function deleteFoodImage(imageUrl: string): Promise<boolean> {
  try {
    // Extract path from public URL
    const url = new URL(imageUrl);
    const pathSegments = url.pathname.split('/');
    const filename = pathSegments.slice(-3).join('/'); // Get last 3 segments: userId/foods/filename.jpg

    const { error } = await supabase.storage
      .from('food-images')
      .remove([filename]);

    if (error) {
      logger.error('Image deletion failed', error);
      return false;
    }

    return true;
  } catch (error) {
    logger.error('Image deletion processing failed', error);
    return false;
  }
}

// Advanced image compression utilities with dynamic quality adjustment
// Created to implement proper image compression before storage

import { logger } from '@/lib/utils/logger';
import { APP_CONFIG } from '@/lib/config/constants';
import { getBase64ImageSize, getMimeTypeFromBase64 } from './image-utils';

export interface CompressionOptions {
  maxSizeBytes: number;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'webp' | 'png';
}

export interface CompressionResult {
  compressedImage: string;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
  quality: number;
}

/**
 * Resize canvas while maintaining aspect ratio
 */
function resizeCanvas(
  sourceCanvas: HTMLCanvasElement,
  maxWidth: number,
  maxHeight: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to create canvas context');
  }

  const { width: originalWidth, height: originalHeight } = sourceCanvas;

  // Calculate new dimensions while maintaining aspect ratio
  let newWidth = originalWidth;
  let newHeight = originalHeight;

  if (originalWidth > maxWidth || originalHeight > maxHeight) {
    const aspectRatio = originalWidth / originalHeight;

    if (originalWidth > originalHeight) {
      newWidth = Math.min(maxWidth, originalWidth);
      newHeight = newWidth / aspectRatio;
    } else {
      newHeight = Math.min(maxHeight, originalHeight);
      newWidth = newHeight * aspectRatio;
    }

    // Ensure we don't exceed the other dimension
    if (newWidth > maxWidth) {
      newWidth = maxWidth;
      newHeight = newWidth / aspectRatio;
    }
    if (newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = newHeight * aspectRatio;
    }
  }

  canvas.width = Math.round(newWidth);
  canvas.height = Math.round(newHeight);

  // Use high-quality scaling
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  // Draw the resized image
  ctx.drawImage(sourceCanvas, 0, 0, newWidth, newHeight);

  return canvas;
}

/**
 * Load base64 image into a canvas
 */
async function loadImageToCanvas(
  base64Data: string
): Promise<HTMLCanvasElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Failed to create canvas context'));
        return;
      }

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      resolve(canvas);
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = base64Data;
  });
}

/**
 * Compress image with progressive quality reduction until target size is met
 */
export async function compressImage(
  base64Data: string,
  options: CompressionOptions
): Promise<CompressionResult> {
  try {
    const originalSize = getBase64ImageSize(base64Data);
    const originalMimeType = getMimeTypeFromBase64(base64Data);

    logger.debug('Starting image compression', {
      originalSize,
      originalMimeType,
      maxSize: options.maxSizeBytes,
    });

    // Load image into canvas
    let canvas = await loadImageToCanvas(base64Data);

    // Resize if dimensions are too large
    if (options.maxWidth || options.maxHeight) {
      const maxWidth = options.maxWidth || 2048;
      const maxHeight = options.maxHeight || 2048;

      if (canvas.width > maxWidth || canvas.height > maxHeight) {
        canvas = resizeCanvas(canvas, maxWidth, maxHeight);
        logger.debug('Image resized', {
          newWidth: canvas.width,
          newHeight: canvas.height,
        });
      }
    }

    // Determine output format
    const outputFormat = options.format || 'jpeg';
    const mimeType = `image/${outputFormat}`;

    // Progressive quality reduction
    let quality = options.quality || 0.9;
    let compressedImage: string;
    let compressedSize: number;

    const maxAttempts = 8; // Prevent infinite loops
    let attempt = 0;

    do {
      attempt++;
      compressedImage = canvas.toDataURL(mimeType, quality);
      compressedSize = getBase64ImageSize(compressedImage);

      logger.debug(`Compression attempt ${attempt}`, {
        quality,
        compressedSize,
        targetSize: options.maxSizeBytes,
      });

      if (compressedSize <= options.maxSizeBytes) {
        break;
      }

      // Reduce quality for next attempt
      quality = Math.max(0.1, quality - 0.15);
    } while (compressedSize > options.maxSizeBytes && attempt < maxAttempts);

    const compressionRatio =
      originalSize > 0 ? compressedSize / originalSize : 1;

    const result: CompressionResult = {
      compressedImage,
      originalSize,
      compressedSize,
      compressionRatio,
      quality,
    };

    logger.debug('Image compression completed', {
      originalSize: result.originalSize,
      compressedSize: result.compressedSize,
      quality: result.quality,
      compressionRatio: result.compressionRatio,
    });

    return result;
  } catch (error) {
    logger.error('Image compression failed', error);
    throw new Error(
      `Image compression failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Smart compression that automatically determines best strategy based on image characteristics
 */
export async function smartCompressImage(
  base64Data: string,
  maxSizeBytes: number = APP_CONFIG.IMAGE.MAX_FILE_SIZE
): Promise<CompressionResult> {
  const originalSize = getBase64ImageSize(base64Data);

  // If image is already small enough, return as-is
  if (originalSize <= maxSizeBytes) {
    return {
      compressedImage: base64Data,
      originalSize,
      compressedSize: originalSize,
      compressionRatio: 1,
      quality: 1,
    };
  }

  // Determine compression strategy based on size
  const compressionOptions: CompressionOptions = {
    maxSizeBytes,
    format: 'jpeg', // JPEG generally provides better compression for photos
  };

  // For very large images, also reduce dimensions
  if (originalSize > maxSizeBytes * 4) {
    compressionOptions.maxWidth = 1920;
    compressionOptions.maxHeight = 1920;
    compressionOptions.quality = 0.8;
  } else if (originalSize > maxSizeBytes * 2) {
    compressionOptions.maxWidth = 2048;
    compressionOptions.maxHeight = 2048;
    compressionOptions.quality = 0.85;
  } else {
    compressionOptions.quality = 0.9;
  }

  return compressImage(base64Data, compressionOptions);
}

/**
 * Compress multiple images
 */
export async function compressImages(
  base64Images: string[],
  maxSizeBytes: number = APP_CONFIG.IMAGE.MAX_FILE_SIZE
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = [];

  for (let i = 0; i < base64Images.length; i++) {
    try {
      const result = await smartCompressImage(base64Images[i], maxSizeBytes);
      results.push(result);
    } catch (error) {
      logger.error(`Failed to compress image ${i + 1}`, error);
      // Re-throw to stop processing if any image fails
      throw error;
    }
  }

  return results;
}

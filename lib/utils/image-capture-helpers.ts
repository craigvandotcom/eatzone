/**
 * Image Capture Helper Functions
 * Utilities for secure image handling in camera capture workflows
 */

import SecureImageStorage from './secure-image-storage';
import { logger } from './logger';

/**
 * Securely store a captured image for temporary use
 */
export function storeTemporaryCapturedImage(
  imageData: string,
  maxSizeMB: number = 4
): boolean {
  try {
    // Validate image format
    if (!imageData.startsWith('data:image/')) {
      logger.error('Invalid image format for temporary storage', {
        dataStart: imageData.substring(0, 50),
      });
      return false;
    }

    // Store using secure storage
    const success = SecureImageStorage.storeTemporaryImage(
      'pendingFoodImage',
      imageData,
      maxSizeMB
    );

    if (success) {
      logger.debug('Image stored securely for food entry', {
        imageSize: new Blob([imageData]).size,
      });
    }

    return success;
  } catch (error) {
    logger.error('Failed to store temporary captured image', error);
    return false;
  }
}

/**
 * Retrieve a temporarily stored captured image
 */
export function retrieveTemporaryCapturedImage(): string | null {
  try {
    const imageData = SecureImageStorage.retrieveTemporaryImage('pendingFoodImage');
    
    if (imageData) {
      logger.debug('Retrieved temporary captured image', {
        imageSize: new Blob([imageData]).size,
      });
    }

    return imageData;
  } catch (error) {
    logger.error('Failed to retrieve temporary captured image', error);
    return null;
  }
}

/**
 * Clear any temporarily stored captured image
 */
export function clearTemporaryCapturedImage(): void {
  try {
    SecureImageStorage.removeTemporaryImage('pendingFoodImage');
    logger.debug('Cleared temporary captured image');
  } catch (error) {
    logger.error('Failed to clear temporary captured image', error);
  }
}

/**
 * Get storage statistics for monitoring
 */
export function getImageStorageStats() {
  return SecureImageStorage.getStorageStats();
}

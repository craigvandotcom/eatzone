/**
 * Secure Image Storage Utility
 * Provides encrypted temporary storage for image data instead of plain sessionStorage
 */

import { logger } from './logger';

// Simple encryption utilities (for demo - in production, use proper crypto library)
class SecureImageStorage {
  private static readonly STORAGE_KEY = 'secure_temp_images';
  private static readonly ENCRYPTION_KEY = 'puls_temp_key'; // In production, use proper key management

  /**
   * Simple XOR encryption (for demo purposes)
   * In production, use proper encryption like AES with Web Crypto API
   */
  private static encrypt(data: string): string {
    const key = this.ENCRYPTION_KEY;
    let result = '';
    for (let i = 0; i < data.length; i++) {
      result += String.fromCharCode(
        data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return btoa(result); // Base64 encode the result
  }

  /**
   * Simple XOR decryption (for demo purposes)
   */
  private static decrypt(encryptedData: string): string {
    try {
      const data = atob(encryptedData); // Base64 decode
      const key = this.ENCRYPTION_KEY;
      let result = '';
      for (let i = 0; i < data.length; i++) {
        result += String.fromCharCode(
          data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
      }
      return result;
    } catch (error) {
      logger.error('Failed to decrypt image data', error);
      return '';
    }
  }

  /**
   * Store image data securely with automatic cleanup
   */
  static storeTemporaryImage(
    imageId: string,
    imageData: string,
    maxSizeMB: number = 4
  ): boolean {
    try {
      // Validate image size
      const imageSize = new Blob([imageData]).size;
      const maxSize = maxSizeMB * 1024 * 1024;

      if (imageSize > maxSize) {
        logger.warn('Image too large for temporary storage', {
          imageSize,
          maxSize,
          imageId,
        });
        return false;
      }

      // Encrypt the image data
      const encryptedData = this.encrypt(imageData);

      // Get existing storage
      const existingData = this.getStorageData();

      // Add new image with timestamp
      existingData[imageId] = {
        data: encryptedData,
        timestamp: Date.now(),
        size: imageSize,
      };

      // Clean up old entries (older than 1 hour)
      this.cleanupOldEntries(existingData);

      // Store back
      try {
        sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingData));
        logger.debug('Image stored securely', {
          imageId,
          encryptedSize: encryptedData.length,
          originalSize: imageSize,
        });
        return true;
      } catch (storageError) {
        logger.error('Failed to store encrypted image', {
          error: storageError,
          imageId,
        });
        return false;
      }
    } catch (error) {
      logger.error('Failed to encrypt and store image', { error, imageId });
      return false;
    }
  }

  /**
   * Retrieve and decrypt image data
   */
  static retrieveTemporaryImage(imageId: string): string | null {
    try {
      const storageData = this.getStorageData();
      const imageEntry = storageData[imageId];

      if (!imageEntry) {
        logger.debug('No image found for ID', { imageId });
        return null;
      }

      // Check if image has expired (1 hour)
      const now = Date.now();
      const maxAge = 60 * 60 * 1000; // 1 hour
      if (now - imageEntry.timestamp > maxAge) {
        logger.debug('Image expired, removing', { imageId });
        this.removeTemporaryImage(imageId);
        return null;
      }

      // Decrypt and return
      const decryptedData = this.decrypt(imageEntry.data);
      if (!decryptedData) {
        logger.error('Failed to decrypt image data', { imageId });
        this.removeTemporaryImage(imageId);
        return null;
      }

      logger.debug('Image retrieved and decrypted', {
        imageId,
        size: imageEntry.size,
      });
      return decryptedData;
    } catch (error) {
      logger.error('Failed to retrieve temporary image', { error, imageId });
      return null;
    }
  }

  /**
   * Remove specific temporary image
   */
  static removeTemporaryImage(imageId: string): void {
    try {
      const storageData = this.getStorageData();
      delete storageData[imageId];
      sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(storageData));
      logger.debug('Temporary image removed', { imageId });
    } catch (error) {
      logger.error('Failed to remove temporary image', { error, imageId });
    }
  }

  /**
   * Clear all temporary images
   */
  static clearAllTemporaryImages(): void {
    try {
      sessionStorage.removeItem(this.STORAGE_KEY);
      logger.debug('All temporary images cleared');
    } catch (error) {
      logger.error('Failed to clear temporary images', error);
    }
  }

  /**
   * Get current storage data
   */
  private static getStorageData(): Record<
    string,
    {
      data: string;
      timestamp: number;
      size: number;
    }
  > {
    try {
      const data = sessionStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      logger.error('Failed to parse storage data', error);
      return {};
    }
  }

  /**
   * Clean up expired entries
   */
  private static cleanupOldEntries(
    storageData: Record<
      string,
      {
        data: string;
        timestamp: number;
        size: number;
      }
    >
  ): void {
    const now = Date.now();
    const maxAge = 60 * 60 * 1000; // 1 hour
    let cleanedCount = 0;

    for (const [imageId, entry] of Object.entries(storageData)) {
      if (entry.timestamp && now - entry.timestamp > maxAge) {
        delete storageData[imageId];
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      logger.debug('Cleaned up expired temporary images', { cleanedCount });
    }
  }

  /**
   * Get storage usage statistics
   */
  static getStorageStats(): {
    totalImages: number;
    totalSize: number;
    oldestImage: number | null;
  } {
    try {
      const storageData = this.getStorageData();
      const entries = Object.values(storageData);

      return {
        totalImages: entries.length,
        totalSize: entries.reduce((sum, entry) => sum + (entry.size || 0), 0),
        oldestImage:
          entries.length > 0
            ? Math.min(...entries.map(entry => entry.timestamp || Date.now()))
            : null,
      };
    } catch (error) {
      logger.error('Failed to get storage stats', error);
      return { totalImages: 0, totalSize: 0, oldestImage: null };
    }
  }
}

export default SecureImageStorage;

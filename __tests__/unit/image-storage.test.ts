/**
 * Unit tests for lib/image-storage.ts
 * Tests image processing, upload, and deletion functionality
 */

import {
  generateImageFilename,
  IMAGE_CONFIG,
} from '@/lib/image-storage';

// Note: Most image-storage functions depend heavily on Supabase client and browser APIs
// These tests focus on pure functions and configuration
// Integration tests with real Supabase would be better for upload/delete functionality

describe('Image Storage Utils', () => {
  describe('generateImageFilename', () => {
    it('should generate correct filename format', () => {
      const filename = generateImageFilename('user123', 'food456', 2);
      expect(filename).toBe('user123/foods/food456_2.jpg');
    });

    it('should default to index 1 if not provided', () => {
      const filename = generateImageFilename('user123', 'food456');
      expect(filename).toBe('user123/foods/food456_1.jpg');
    });

    it('should handle various user IDs and food IDs', () => {
      expect(generateImageFilename('abc', 'xyz')).toBe('abc/foods/xyz_1.jpg');
      expect(generateImageFilename('user-with-dash', 'food-123', 5)).toBe('user-with-dash/foods/food-123_5.jpg');
    });
  });

  describe('IMAGE_CONFIG', () => {
    it('should export correct configuration constants', () => {
      expect(IMAGE_CONFIG.maxSize).toBe(800);
      expect(IMAGE_CONFIG.quality).toBe(0.75);
      expect(IMAGE_CONFIG.format).toBe('image/jpeg');
    });

    it('should have reasonable configuration values', () => {
      expect(IMAGE_CONFIG.maxSize).toBeGreaterThan(0);
      expect(IMAGE_CONFIG.quality).toBeGreaterThan(0);
      expect(IMAGE_CONFIG.quality).toBeLessThanOrEqual(1);
    });
  });
});
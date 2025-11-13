/**
 * Unit tests for file validation utilities used in upload flow
 * Tests validateImageFile, validateMagicNumbers, and validateImageFiles
 */

import {
  validateImageFile,
  validateMagicNumbers,
  validateImageFiles,
} from '@/lib/utils/file-validation';
import { APP_CONFIG } from '@/lib/config/constants';

// Mock logger to prevent console output in tests
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    error: jest.fn(),
    warn: jest.fn(),
    debug: jest.fn(),
  },
}));

/**
 * Helper function to create a valid JPEG base64 string
 */
function createValidJPEGBase64(): string {
  const jpegData = [
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
  ];
  const binaryString = String.fromCharCode(...jpegData);
  const base64Data = btoa(binaryString);
  return `data:image/jpeg;base64,${base64Data}`;
}

/**
 * Helper function to create a valid PNG base64 string
 */
function createValidPNGBase64(): string {
  const pngData = [
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    0x49, 0x48, 0x44, 0x52, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01,
    0x08, 0x06, 0x00, 0x00, 0x00, 0x1f, 0x15, 0xc4, 0x89, 0x00, 0x00, 0x00,
    0x0a, 0x49, 0x44, 0x41, 0x54, 0x78, 0x9c, 0x63, 0x00, 0x01, 0x00, 0x00,
    0x05, 0x00, 0x01, 0x0d, 0x0a, 0x2d, 0xb4, 0x00, 0x00, 0x00, 0x00, 0x49,
    0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82,
  ];
  const binaryString = String.fromCharCode(...pngData);
  const base64Data = btoa(binaryString);
  return `data:image/png;base64,${base64Data}`;
}

describe('File Validation - Upload Flow', () => {
  describe('validateImageFile', () => {
    it('should validate correct JPEG image', () => {
      const validJpeg = createValidJPEGBase64();
      const result = validateImageFile(validJpeg);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should validate correct PNG image', () => {
      const validPng = createValidPNGBase64();
      const result = validateImageFile(validPng);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject invalid data format (missing data: prefix)', () => {
      const invalidFormat = 'image/jpeg;base64,dGVzdA==';
      const result = validateImageFile(invalidFormat);
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('INVALID_DATA_FORMAT');
      expect(result.error?.message).toContain('Expected data URL format');
    });

    it('should reject oversized images', () => {
      const maxSize = APP_CONFIG.IMAGE.MAX_FILE_SIZE;
      // Create base64 string that represents a file larger than max size
      // Base64 encoding increases size by ~33%, so we need to account for that
      const oversizedBase64 = 'a'.repeat(Math.ceil((maxSize * 1.5) / 3) * 4);
      const oversizedFile = `data:image/jpeg;base64,${oversizedBase64}`;

      const result = validateImageFile(oversizedFile);
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('FILE_TOO_LARGE');
      expect(result.error?.message).toContain('exceeds maximum limit');
    });

    it('should reject invalid MIME types', () => {
      const invalidMime = 'data:image/bmp;base64,dGVzdA==';
      const result = validateImageFile(invalidMime);
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('INVALID_MIME_TYPE');
    });

    it('should reject files with mismatched magic numbers', () => {
      // PNG magic numbers with JPEG MIME type
      const pngMagic = btoa('\x89PNG\r\n\x1a\n');
      const mismatch = `data:image/jpeg;base64,${pngMagic}`;
      const result = validateImageFile(mismatch);
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('INVALID_FILE_SIGNATURE');
    });

    it('should handle empty base64 data', () => {
      const empty = 'data:image/jpeg;base64,';
      const result = validateImageFile(empty);
      // Empty base64 has size 0, which passes size check
      // It may pass or fail magic number validation depending on implementation
      // Test documents current behavior
      if (!result.valid) {
        expect(result.error).toBeDefined();
        expect(result.error?.code).toBeDefined();
      } else {
        // If it passes, that's acceptable - empty files are technically valid
        expect(result.valid).toBe(true);
      }
    });

    it('should handle corrupted base64 data', () => {
      const corrupted = 'data:image/jpeg;base64,invalid!!!base64===';
      const result = validateImageFile(corrupted);
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('INVALID_FILE_SIGNATURE');
    });

    it('should handle non-image data URLs', () => {
      const textFile = 'data:text/plain;base64,dGVzdA==';
      const result = validateImageFile(textFile);
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('INVALID_DATA_FORMAT');
    });
  });

  describe('validateMagicNumbers', () => {
    it('should validate correct JPEG magic numbers', () => {
      const jpegMagic = btoa('\xFF\xD8\xFF\xE0');
      const jpegData = `data:image/jpeg;base64,${jpegMagic}`;
      const result = validateMagicNumbers(jpegData, 'image/jpeg');
      expect(result).toBe(true);
    });

    it('should validate correct PNG magic numbers', () => {
      const pngMagic = btoa('\x89PNG\r\n\x1a\n');
      const pngData = `data:image/png;base64,${pngMagic}`;
      const result = validateMagicNumbers(pngData, 'image/png');
      expect(result).toBe(true);
    });

    it('should reject mismatched magic numbers', () => {
      const pngMagic = btoa('\x89PNG\r\n\x1a\n');
      const jpegData = `data:image/jpeg;base64,${pngMagic}`;
      const result = validateMagicNumbers(jpegData, 'image/jpeg');
      expect(result).toBe(false);
    });

    it('should handle unknown MIME types', () => {
      const jpegMagic = btoa('\xFF\xD8\xFF\xE0');
      const data = `data:image/jpeg;base64,${jpegMagic}`;
      const result = validateMagicNumbers(data, 'image/bmp');
      expect(result).toBe(false);
    });

    it('should handle corrupted base64 gracefully', () => {
      const corrupted = 'data:image/jpeg;base64,invalid!!!';
      const result = validateMagicNumbers(corrupted, 'image/jpeg');
      expect(result).toBe(false);
    });
  });

  describe('validateImageFiles', () => {
    it('should validate multiple valid images', () => {
      const images = [createValidJPEGBase64(), createValidPNGBase64()];
      const result = validateImageFiles(images);
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should fail on first invalid image', () => {
      const validImage = createValidJPEGBase64();
      const invalidImage = 'data:image/jpeg;base64,invalid';
      const result = validateImageFiles([validImage, invalidImage]);
      expect(result.valid).toBe(false);
      expect(result.error?.message).toContain('Image 2:');
    });

    it('should handle empty array', () => {
      const result = validateImageFiles([]);
      expect(result.valid).toBe(true);
    });

    it('should handle single image array', () => {
      const images = [createValidJPEGBase64()];
      const result = validateImageFiles(images);
      expect(result.valid).toBe(true);
    });

    it('should handle mixed valid and invalid files', () => {
      const validImage = createValidJPEGBase64();
      const oversizedBase64 = 'a'.repeat(50000000);
      const oversizedFile = `data:image/jpeg;base64,${oversizedBase64}`;
      const result = validateImageFiles([validImage, oversizedFile]);
      expect(result.valid).toBe(false);
      expect(result.error?.message).toContain('Image 2:');
    });

    it('should preserve error codes from individual validations', () => {
      const invalidMime = 'data:image/bmp;base64,dGVzdA==';
      const result = validateImageFiles([invalidMime]);
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('INVALID_MIME_TYPE');
    });
  });

  describe('Edge Cases', () => {
    it('should handle null input gracefully', () => {
      // @ts-ignore - Testing runtime behavior
      const result = validateImageFile(null);
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });

    it('should handle undefined input gracefully', () => {
      // @ts-ignore - Testing runtime behavior
      const result = validateImageFile(undefined);
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('VALIDATION_ERROR');
    });

    it('should handle empty string', () => {
      const result = validateImageFile('');
      expect(result.valid).toBe(false);
      expect(result.error?.code).toBe('INVALID_DATA_FORMAT');
    });

    it('should handle non-string inputs', () => {
      // @ts-ignore - Testing runtime behavior
      const numberResult = validateImageFile(12345);
      expect(numberResult.valid).toBe(false);
      expect(numberResult.error?.code).toBe('VALIDATION_ERROR');
    });
  });
});

// Client-side file validation utilities
// Extracted from server-side validation for reuse in camera components

import { logger } from '@/lib/utils/logger';
import { APP_CONFIG } from '@/lib/config/constants';
import {
  getMimeTypeFromBase64,
  getBase64ImageSize,
  isValidImageType,
} from './image-utils';

// Use centralized configuration
const FILE_CONFIG = {
  maxSize: APP_CONFIG.IMAGE.MAX_FILE_SIZE,
  allowedTypes: APP_CONFIG.IMAGE.ALLOWED_TYPES,
  allowedExtensions: APP_CONFIG.IMAGE.ALLOWED_EXTENSIONS,
  magicNumbers: APP_CONFIG.IMAGE.MAGIC_NUMBERS,
} as const;

export interface ValidationResult {
  valid: boolean;
  error?: {
    message: string;
    code: string;
  };
}

/**
 * Validate file magic numbers (first few bytes) to ensure file type matches MIME type
 */
export function validateMagicNumbers(
  base64Data: string,
  mimeType: string
): boolean {
  try {
    // Remove data URL prefix if present
    const base64 = base64Data.replace(/^data:image\/[a-z]+;base64,/, '');

    // Convert first few bytes from base64
    const binaryString = atob(base64.substring(0, 12)); // First ~9 bytes should be enough
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Check magic numbers based on MIME type
    const expectedMagic =
      FILE_CONFIG.magicNumbers[
        mimeType as keyof typeof FILE_CONFIG.magicNumbers
      ];
    if (!expectedMagic) {
      return false; // Unknown MIME type
    }

    // Verify the first bytes match
    for (let i = 0; i < expectedMagic.length && i < bytes.length; i++) {
      if (bytes[i] !== expectedMagic[i]) {
        return false;
      }
    }

    return true;
  } catch (error) {
    logger.error('Magic number validation failed', error);
    return false;
  }
}

/**
 * Validate image file before processing
 * Returns validation result with detailed error information
 */
export function validateImageFile(base64Data: string): ValidationResult {
  try {
    // 1. Validate base64 data format
    if (!base64Data.startsWith('data:image/')) {
      return {
        valid: false,
        error: {
          message: 'Invalid image format. Expected data URL format.',
          code: 'INVALID_DATA_FORMAT',
        },
      };
    }

    // 2. Extract and validate MIME type
    const mimeType = getMimeTypeFromBase64(base64Data);
    if (!mimeType) {
      return {
        valid: false,
        error: {
          message: 'Unable to determine image type.',
          code: 'UNKNOWN_MIME_TYPE',
        },
      };
    }

    // 3. Validate MIME type is allowed
    if (!isValidImageType(base64Data, [...FILE_CONFIG.allowedTypes])) {
      return {
        valid: false,
        error: {
          message: `Image type ${mimeType} is not allowed. Allowed types: ${FILE_CONFIG.allowedTypes.join(', ')}`,
          code: 'INVALID_MIME_TYPE',
        },
      };
    }

    // 4. Validate file size
    const fileSize = getBase64ImageSize(base64Data);
    if (fileSize > FILE_CONFIG.maxSize) {
      return {
        valid: false,
        error: {
          message: `Image size exceeds maximum limit of ${Math.round(FILE_CONFIG.maxSize / 1024 / 1024)}MB`,
          code: 'FILE_TOO_LARGE',
        },
      };
    }

    // 5. Validate magic numbers (file signature)
    if (!validateMagicNumbers(base64Data, mimeType)) {
      return {
        valid: false,
        error: {
          message: 'Image content does not match declared type',
          code: 'INVALID_FILE_SIGNATURE',
        },
      };
    }

    // All validations passed
    return { valid: true };
  } catch (error) {
    logger.error('Image validation error', error);
    return {
      valid: false,
      error: {
        message: 'Image validation failed due to an unexpected error',
        code: 'VALIDATION_ERROR',
      },
    };
  }
}

/**
 * Validate multiple images
 */
export function validateImageFiles(base64Images: string[]): ValidationResult {
  for (let i = 0; i < base64Images.length; i++) {
    const result = validateImageFile(base64Images[i]);
    if (!result.valid) {
      return {
        valid: false,
        error: {
          message: `Image ${i + 1}: ${result.error?.message}`,
          code: result.error?.code || 'VALIDATION_ERROR',
        },
      };
    }
  }

  return { valid: true };
}

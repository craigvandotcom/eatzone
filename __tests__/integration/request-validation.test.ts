/**
 * Integration tests for request validation middleware
 * Tests request size limits, image validation, and security checks
 */

import { NextRequest } from 'next/server';
import {
  validateRequestSize,
  validateAndParseJSON,
  validateImageData,
  validateImageAnalysisRequest,
  createValidationErrorResponse,
} from '@/lib/middleware/request-validation';

// Helper function to create mock requests
function createMockRequest(
  body: any,
  headers: Record<string, string> = {}
): NextRequest {
  const jsonBody = JSON.stringify(body);
  const mockRequest = {
    json: jest.fn().mockResolvedValue(body),
    headers: {
      get: jest.fn((key: string) => headers[key] || null),
    },
    url: 'http://localhost:3000/api/test',
  } as unknown as NextRequest;

  // Set content-length if not provided
  if (!headers['content-length']) {
    (mockRequest.headers.get as jest.Mock).mockImplementation((key: string) => {
      if (key === 'content-length') return jsonBody.length.toString();
      return headers[key] || null;
    });
  }

  return mockRequest;
}

// Helper to create base64 image data
function createMockImageData(sizeKB: number = 1): string {
  // Base64 uses 4 characters for every 3 bytes, so for desired decoded size:
  // We need (sizeKB * 1024) bytes decoded, which requires (sizeKB * 1024 * 4/3) base64 chars
  const base64Length = Math.floor((sizeKB * 1024 * 4) / 3);
  const data = 'A'.repeat(base64Length);
  return `data:image/jpeg;base64,${data}`;
}

describe('Request Validation Middleware', () => {
  describe('validateRequestSize', () => {
    test('should allow requests under size limit', async () => {
      const request = createMockRequest({ test: 'data' });
      const result = await validateRequestSize(request, 1024 * 1024); // 1MB

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    test('should reject requests over size limit', async () => {
      const largeData = 'x'.repeat(1024 * 1024); // 1MB of data
      const request = createMockRequest(
        { data: largeData },
        {
          'content-length': (1024 * 1024 + 1000).toString(),
        }
      );

      const result = await validateRequestSize(request, 1024 * 512); // 512KB limit

      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('REQUEST_TOO_LARGE');
      expect(result.error?.statusCode).toBe(413);
    });

    test('should handle missing content-length header', async () => {
      const request = createMockRequest({ test: 'data' }, {});
      // Mock to return null for content-length
      (request.headers.get as jest.Mock).mockReturnValue(null);

      const result = await validateRequestSize(request);

      expect(result.isValid).toBe(true); // Should pass when content-length is missing
    });

    test('should handle invalid content-length header', async () => {
      const request = createMockRequest(
        { test: 'data' },
        {
          'content-length': 'invalid',
        }
      );

      const result = await validateRequestSize(request);

      expect(result.isValid).toBe(true); // Should pass when content-length is invalid
    });
  });

  describe('validateAndParseJSON', () => {
    test('should successfully parse valid JSON', async () => {
      const testData = { test: 'value', number: 42 };
      const request = createMockRequest(testData);

      const result = await validateAndParseJSON(request);

      expect(result.isValid).toBe(true);
      expect(result.data).toEqual(testData);
    });

    test('should reject invalid JSON', async () => {
      const request = {
        json: jest.fn().mockRejectedValue(new SyntaxError('Invalid JSON')),
        headers: {
          get: jest.fn().mockReturnValue('100'),
        },
        url: 'http://localhost:3000/api/test',
      } as unknown as NextRequest;

      const result = await validateAndParseJSON(request);

      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('INVALID_JSON');
      expect(result.error?.statusCode).toBe(400);
    });

    test('should respect size limits', async () => {
      const request = createMockRequest(
        { test: 'data' },
        {
          'content-length': '2000',
        }
      );

      const result = await validateAndParseJSON(request, 1000); // 1KB limit

      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('REQUEST_TOO_LARGE');
    });
  });

  describe('validateImageData', () => {
    test('should accept valid single image', () => {
      const imageData = createMockImageData(500); // 500KB
      const data = { image: imageData };

      const result = validateImageData(data);

      expect(result.isValid).toBe(true);
    });

    test('should accept valid multiple images', () => {
      const imageData1 = createMockImageData(300);
      const imageData2 = createMockImageData(400);
      const data = { images: [imageData1, imageData2] };

      const result = validateImageData(data);

      expect(result.isValid).toBe(true);
    });

    test('should reject too many images', () => {
      const images = Array.from({ length: 10 }, () => createMockImageData(100));
      const data = { images };

      const result = validateImageData(data);

      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('TOO_MANY_IMAGES');
    });

    test('should reject images that are too large', () => {
      // Create a very large image (simulate 15MB decoded)
      // APP_CONFIG.IMAGE.MAX_FILE_SIZE is 10MB by default
      const largeImage = createMockImageData(15 * 1024); // 15MB
      const data = { image: largeImage };

      const result = validateImageData(data);

      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('IMAGE_TOO_LARGE');
    });

    test('should reject invalid image format', () => {
      const data = { image: 'not-a-valid-image' };

      const result = validateImageData(data);

      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('INVALID_IMAGE_FORMAT');
    });

    test('should reject non-string image data', () => {
      const data = { images: [123, 'valid-image'] };

      const result = validateImageData(data);

      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('INVALID_IMAGE_TYPE');
    });

    test('should handle empty images array', () => {
      const data = { images: [] };

      const result = validateImageData(data);

      expect(result.isValid).toBe(true); // Empty array is valid
    });

    test('should reject non-array images field', () => {
      const data = { images: 'not-an-array' };

      const result = validateImageData(data);

      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('INVALID_IMAGE_FORMAT');
    });
  });

  describe('validateImageAnalysisRequest', () => {
    test('should validate complete image analysis request', async () => {
      const imageData = createMockImageData(500);
      const requestBody = { image: imageData };
      const request = createMockRequest(requestBody);

      const result = await validateImageAnalysisRequest(request);

      expect(result.isValid).toBe(true);
      expect(result.data).toEqual(requestBody);
    });

    test('should reject request with invalid size and invalid images', async () => {
      const largeImage = createMockImageData(15 * 1024); // 15MB each
      const requestBody = { images: [largeImage, largeImage, largeImage] };
      const request = createMockRequest(requestBody);

      const result = await validateImageAnalysisRequest(request);

      expect(result.isValid).toBe(false);
      // Should catch the first error (could be size limit 413 or image validation 400)
      expect([400, 413]).toContain(result.error?.statusCode);
    });

    test('should handle malformed JSON in image analysis request', async () => {
      const request = {
        json: jest.fn().mockRejectedValue(new SyntaxError('Malformed JSON')),
        headers: {
          get: jest.fn().mockReturnValue('500'),
        },
        url: 'http://localhost:3000/api/analyze-image',
      } as unknown as NextRequest;

      const result = await validateImageAnalysisRequest(request);

      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('INVALID_JSON');
    });
  });

  describe('createValidationErrorResponse', () => {
    test('should create proper error response', () => {
      const validationResult = {
        isValid: false,
        error: {
          message: 'Test error',
          code: 'TEST_ERROR',
          statusCode: 400,
        },
      };

      const response = createValidationErrorResponse(validationResult);

      expect(response.status).toBe(400);
      // Test that response body is correct (would need to parse in real usage)
    });

    test('should throw when no error in result', () => {
      const validationResult = {
        isValid: false,
      };

      expect(() => createValidationErrorResponse(validationResult)).toThrow(
        'No error in validation result'
      );
    });
  });

  describe('Edge Cases and Security', () => {
    test('should handle extremely large request gracefully', async () => {
      const request = createMockRequest(
        { test: 'data' },
        {
          'content-length': '999999999999', // Very large number
        }
      );

      const result = await validateRequestSize(request, 1024 * 1024);

      expect(result.isValid).toBe(false);
      expect(result.error?.code).toBe('REQUEST_TOO_LARGE');
    });

    test('should handle image with malicious filename patterns', () => {
      const maliciousImage = 'data:image/jpeg;base64,../../../etc/passwd';
      const data = { image: maliciousImage };

      const result = validateImageData(data);

      // Should still validate the data URL format correctly
      expect(result.isValid).toBe(true); // This is a valid data URL format
    });

    test('should validate against different image MIME types', () => {
      const validTypes = [
        'data:image/jpeg;base64,validdata',
        'data:image/png;base64,validdata',
        'data:image/webp;base64,validdata',
        'data:image/gif;base64,validdata',
      ];

      validTypes.forEach(image => {
        const result = validateImageData({ image });
        expect(result.isValid).toBe(true);
      });
    });

    test('should reject non-image data URLs', () => {
      const nonImageTypes = [
        'data:text/plain;base64,validdata',
        'data:application/pdf;base64,validdata',
        'data:video/mp4;base64,validdata',
      ];

      nonImageTypes.forEach(image => {
        const result = validateImageData({ image });
        expect(result.isValid).toBe(false);
        expect(result.error?.code).toBe('INVALID_IMAGE_FORMAT');
      });
    });

    test('should handle concurrent validation requests', async () => {
      const requests = Array.from({ length: 10 }, (_, i) => {
        const imageData = createMockImageData(100);
        return createMockRequest({ image: imageData, id: i });
      });

      const promises = requests.map(req => validateImageAnalysisRequest(req));
      const results = await Promise.all(promises);

      // All should succeed
      results.forEach(result => {
        expect(result.isValid).toBe(true);
      });
    });
  });
});

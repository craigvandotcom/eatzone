/**
 * Unit tests for image compression utilities used in upload flow
 * Tests smartCompressImage and compression behavior
 */

import { smartCompressImage } from '@/lib/utils/image-compression';
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
  // Minimal valid JPEG structure
  const jpegData = [
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    0x01, 0x01, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xd9,
  ];
  const binaryString = String.fromCharCode(...jpegData);
  const base64Data = btoa(binaryString);
  return `data:image/jpeg;base64,${base64Data}`;
}

/**
 * Create a mock canvas element for testing
 */
function createMockCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    // Fill with test data
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(0, 0, width, height);
  }
  return canvas;
}

/**
 * Create a mock image element for testing
 */
function createMockImage(
  width: number,
  height: number,
  src: string
): HTMLImageElement {
  const img = new Image();
  Object.defineProperty(img, 'width', { value: width, writable: false });
  Object.defineProperty(img, 'height', { value: height, writable: false });
  Object.defineProperty(img, 'src', { value: src, writable: false });
  return img;
}

// Mock image-utils module
jest.mock('@/lib/utils/image-utils', () => {
  const actual = jest.requireActual('@/lib/utils/image-utils');
  return {
    ...actual,
    getBase64ImageSize: jest.fn(),
  };
});

describe('Image Compression - Upload Flow', () => {
  const { getBase64ImageSize } = require('@/lib/utils/image-utils');

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock Image constructor
    global.Image = jest.fn().mockImplementation(() => {
      const img = document.createElement('img');
      return img;
    }) as any;

    // Mock canvas.toDataURL
    HTMLCanvasElement.prototype.toDataURL = jest.fn().mockImplementation(() => {
      return createValidJPEGBase64();
    });
  });

  describe('smartCompressImage', () => {
    it('should return image as-is if already small enough', async () => {
      const smallImage = createValidJPEGBase64();
      const maxSize = APP_CONFIG.IMAGE.MAX_FILE_SIZE;

      // Mock getBase64ImageSize to return a small size
      getBase64ImageSize.mockReturnValue(maxSize / 2);

      const result = await smartCompressImage(smallImage, maxSize);

      expect(result.compressedImage).toBe(smallImage);
      expect(result.compressionRatio).toBe(1);
      expect(result.quality).toBe(1);
      expect(result.originalSize).toBe(maxSize / 2);
      expect(result.compressedSize).toBe(maxSize / 2);
    });

    // Note: Compression tests that require browser APIs (Image, Canvas) are complex to mock
    // These are better tested in integration/E2E tests. Here we focus on testable logic.
    it('should handle edge case: exactly at max size', async () => {
      const image = createValidJPEGBase64();
      const maxSize = APP_CONFIG.IMAGE.MAX_FILE_SIZE;

      getBase64ImageSize.mockReturnValue(maxSize);

      const result = await smartCompressImage(image, maxSize);

      expect(result.compressedImage).toBe(image);
      expect(result.compressionRatio).toBe(1);
      expect(result.quality).toBe(1);
    });
  });
});

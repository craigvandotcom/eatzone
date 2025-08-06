/**
 * Tests for /api/analyze-image route
 *
 * These tests ensure the image analysis API endpoint:
 * - Handles valid/invalid image inputs correctly
 * - Returns proper error codes and messages
 * - Works without authentication (API routes handle their own auth)
 */

import { POST } from '@/app/api/analyze-image/route';
import {
  createMockRequest,
  createTestImageDataUrl,
  mockOpenRouterResponse,
  apiAssertions,
  setupApiTestEnvironment,
} from './test-helpers';

// Mock the OpenRouter client
jest.mock('@/lib/ai/openrouter', () => ({
  openrouter: {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  },
}));

// Mock the logger to reduce noise in tests
jest.mock('@/lib/utils/logger', () => ({
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock the prompts
jest.mock('@/lib/prompts', () => ({
  prompts: {
    imageAnalysis:
      'Analyze this image and return JSON with mealSummary and ingredients.',
    ingredientZoning: 'Zone these ingredients.',
  },
}));

describe('/api/analyze-image', () => {
  const { openrouter } = require('@/lib/ai/openrouter');
  const mockCreate = openrouter.chat.completions.create;

  // Setup test environment with required env vars
  setupApiTestEnvironment({
    OPENROUTER_API_KEY: 'test-api-key',
    // No Redis env vars - simulating development environment
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Success Cases', () => {
    it('should return 200 with empty ingredients for a 1x1 pixel image', async () => {
      // Mock OpenRouter to return minimal valid response
      mockCreate.mockResolvedValueOnce(
        mockOpenRouterResponse(
          JSON.stringify({
            mealSummary: 'unknown',
            ingredients: [],
          })
        )
      );

      const request = createMockRequest('/api/analyze-image', {
        method: 'POST',
        body: {
          image: createTestImageDataUrl('valid'),
        },
      });

      const response = await POST(request);
      apiAssertions.expectSuccess(response);

      const data = await response.json();
      expect(data).toEqual({
        mealSummary: 'unknown',
        ingredients: [],
      });

      // Verify OpenRouter was called
      expect(mockCreate).toHaveBeenCalledTimes(1);
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'openai/gpt-4o',
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.arrayContaining([
                expect.objectContaining({ type: 'text' }),
                expect.objectContaining({ type: 'image_url' }),
              ]),
            }),
          ]),
        })
      );
    });

    it('should parse and normalize ingredient data correctly', async () => {
      mockCreate.mockResolvedValueOnce(
        mockOpenRouterResponse(
          JSON.stringify({
            mealSummary: 'chicken salad',
            ingredients: [
              { name: 'Chicken Breast', isOrganic: false },
              { name: 'LETTUCE', isOrganic: true },
              { name: '  olive oil  ', isOrganic: false },
              { name: 'lettuce', isOrganic: true }, // Duplicate
            ],
          })
        )
      );

      const request = createMockRequest('/api/analyze-image', {
        method: 'POST',
        body: {
          image: createTestImageDataUrl('valid'),
        },
      });

      const response = await POST(request);
      apiAssertions.expectSuccess(response);

      const data = await response.json();
      expect(data.mealSummary).toBe('chicken salad');
      expect(data.ingredients).toHaveLength(3); // Duplicates removed
      expect(data.ingredients).toEqual([
        { name: 'chicken breast', isOrganic: false },
        { name: 'lettuce', isOrganic: true },
        { name: 'olive oil', isOrganic: false },
      ]);
    });

    it('should handle markdown-wrapped JSON responses', async () => {
      // Some AI models wrap JSON in markdown code blocks
      mockCreate.mockResolvedValueOnce(
        mockOpenRouterResponse(
          '```json\n' +
            JSON.stringify({
              mealSummary: 'apple',
              ingredients: [{ name: 'apple', isOrganic: true }],
            }) +
            '\n```'
        )
      );

      const request = createMockRequest('/api/analyze-image', {
        method: 'POST',
        body: {
          image: createTestImageDataUrl('valid'),
        },
      });

      const response = await POST(request);
      apiAssertions.expectSuccess(response);

      const data = await response.json();
      expect(data.mealSummary).toBe('apple');
      expect(data.ingredients).toEqual([{ name: 'apple', isOrganic: true }]);
    });
  });

  describe('Error Cases', () => {
    it('should return 400 for missing image data', async () => {
      const request = createMockRequest('/api/analyze-image', {
        method: 'POST',
        body: {},
      });

      const response = await POST(request);
      await apiAssertions.expectValidationError(response);
    });

    it('should return 400 for invalid image format', async () => {
      const request = createMockRequest('/api/analyze-image', {
        method: 'POST',
        body: {
          image: 'not-a-data-url',
        },
      });

      const response = await POST(request);
      await apiAssertions.expectError(response, 400, 'INVALID_IMAGE_FORMAT');
    });

    it('should return 503 when OpenRouter fails with auth error', async () => {
      mockCreate.mockRejectedValueOnce(
        new Error('401 Unauthorized: Invalid API key')
      );

      const request = createMockRequest('/api/analyze-image', {
        method: 'POST',
        body: {
          image: createTestImageDataUrl('valid'),
        },
      });

      const response = await POST(request);
      await apiAssertions.expectAuthError(response);
    });

    it('should return 503 when OpenRouter API is unavailable', async () => {
      mockCreate.mockRejectedValueOnce(
        new Error('fetch failed: Network error')
      );

      const request = createMockRequest('/api/analyze-image', {
        method: 'POST',
        body: {
          image: createTestImageDataUrl('valid'),
        },
      });

      const response = await POST(request);
      await apiAssertions.expectError(response, 503, 'AI_SERVICE_ERROR');
    });

    it('should return 500 when AI returns invalid JSON', async () => {
      mockCreate.mockResolvedValueOnce(
        mockOpenRouterResponse('This is not JSON')
      );

      const request = createMockRequest('/api/analyze-image', {
        method: 'POST',
        body: {
          image: createTestImageDataUrl('valid'),
        },
      });

      const response = await POST(request);
      await apiAssertions.expectError(response, 500, 'INTERNAL_SERVER_ERROR');
    });

    it('should return 500 when AI response has wrong structure', async () => {
      mockCreate.mockResolvedValueOnce(
        mockOpenRouterResponse(
          JSON.stringify({
            // Missing required fields
            someOtherField: 'value',
          })
        )
      );

      const request = createMockRequest('/api/analyze-image', {
        method: 'POST',
        body: {
          image: createTestImageDataUrl('valid'),
        },
      });

      const response = await POST(request);
      await apiAssertions.expectError(response, 500, 'INTERNAL_SERVER_ERROR');
    });
  });

  describe('Rate Limiting', () => {
    it('should not apply rate limiting when Redis is not configured', async () => {
      // Make multiple requests quickly
      const requests = Array(5)
        .fill(null)
        .map(() =>
          createMockRequest('/api/analyze-image', {
            method: 'POST',
            body: { image: createTestImageDataUrl('valid') },
          })
        );

      mockCreate.mockResolvedValue(
        mockOpenRouterResponse(
          JSON.stringify({
            mealSummary: 'test',
            ingredients: [],
          })
        )
      );

      // All requests should succeed
      const responses = await Promise.all(requests.map(req => POST(req)));

      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Environment Configuration', () => {
    it('should handle missing OPENROUTER_API_KEY gracefully', async () => {
      // Temporarily remove the API key
      const originalKey = process.env.OPENROUTER_API_KEY;
      delete process.env.OPENROUTER_API_KEY;

      const request = createMockRequest('/api/analyze-image', {
        method: 'POST',
        body: {
          image: createTestImageDataUrl('valid'),
        },
      });

      const response = await POST(request);
      await apiAssertions.expectError(response, 503, 'SERVICE_NOT_CONFIGURED');

      // Restore the key
      process.env.OPENROUTER_API_KEY = originalKey;
    });
  });
});

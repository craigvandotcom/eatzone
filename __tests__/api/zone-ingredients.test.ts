/**
 * Tests for /api/zone-ingredients route
 *
 * These tests ensure the ingredient zoning API endpoint:
 * - Correctly processes ingredient lists
 * - Returns proper zone classifications
 * - Handles errors gracefully
 */

import { POST } from '@/app/api/zone-ingredients/route';
import {
  createMockRequest,
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

// Mock the logger
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
    imageAnalysis: 'Analyze this image.',
    ingredientZoning: 'Zone these ingredients based on health impact.',
  },
}));

describe('/api/zone-ingredients', () => {
  const { openrouter } = require('@/lib/ai/openrouter');
  const mockCreate = openrouter.chat.completions.create;

  setupApiTestEnvironment({
    OPENROUTER_API_KEY: 'test-api-key',
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Success Cases', () => {
    it('should zone ingredients and return enriched data', async () => {
      mockCreate.mockResolvedValueOnce(
        mockOpenRouterResponse(
          JSON.stringify({
            ingredients: [
              {
                name: 'spinach',
                zone: 'green',
                foodGroup: 'vegetables',
                organic: false,
                explanation: 'Nutrient-dense leafy green',
              },
              {
                name: 'chicken breast',
                zone: 'green',
                foodGroup: 'proteins',
                organic: false,
                explanation: 'Lean protein source',
              },
              {
                name: 'white bread',
                zone: 'red',
                foodGroup: 'grains',
                organic: false,
                explanation: 'Highly processed, low fiber',
              },
            ],
          })
        )
      );

      const request = createMockRequest('/api/zone-ingredients', {
        method: 'POST',
        body: {
          ingredients: ['spinach', 'chicken breast', 'white bread'],
        },
      });

      const response = await POST(request);
      apiAssertions.expectSuccess(response);

      const data = await response.json();
      expect(data.ingredients).toHaveLength(3);
      expect(data.ingredients[0]).toEqual({
        name: 'spinach',
        zone: 'green',
        foodGroup: 'vegetables',
        organic: false,
        explanation: 'Nutrient-dense leafy green',
      });

      // Verify OpenRouter was called correctly
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'openai/gpt-4o-mini',
          messages: expect.arrayContaining([
            expect.objectContaining({
              role: 'user',
              content: expect.stringContaining(
                'spinach, chicken breast, white bread'
              ),
            }),
          ]),
        })
      );
    });

    it('should handle empty ingredient list', async () => {
      const request = createMockRequest('/api/zone-ingredients', {
        method: 'POST',
        body: {
          ingredients: [],
        },
      });

      const response = await POST(request);
      apiAssertions.expectSuccess(response);

      const data = await response.json();
      expect(data.ingredients).toEqual([]);

      // Should not call OpenRouter for empty list
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should normalize ingredient names in response', async () => {
      mockCreate.mockResolvedValueOnce(
        mockOpenRouterResponse(
          JSON.stringify({
            ingredients: [
              {
                name: 'OLIVE OIL', // Different case
                zone: 'green',
                foodGroup: 'fats',
                organic: false,
              },
              {
                name: '  sugar  ', // Extra spaces
                zone: 'red',
                foodGroup: 'sugars',
                organic: false,
              },
            ],
          })
        )
      );

      const request = createMockRequest('/api/zone-ingredients', {
        method: 'POST',
        body: {
          ingredients: ['olive oil', 'sugar'],
        },
      });

      const response = await POST(request);
      apiAssertions.expectSuccess(response);

      const data = await response.json();
      expect(data.ingredients).toEqual([
        {
          name: 'olive oil',
          zone: 'green',
          foodGroup: 'fats',
          organic: false,
        },
        {
          name: 'sugar',
          zone: 'red',
          foodGroup: 'sugars',
          organic: false,
        },
      ]);
    });

    it('should handle markdown-wrapped JSON responses', async () => {
      mockCreate.mockResolvedValueOnce(
        mockOpenRouterResponse(
          '```json\n' +
            JSON.stringify({
              ingredients: [
                {
                  name: 'apple',
                  zone: 'green',
                  foodGroup: 'fruits',
                  organic: true,
                },
              ],
            }) +
            '\n```'
        )
      );

      const request = createMockRequest('/api/zone-ingredients', {
        method: 'POST',
        body: {
          ingredients: ['apple'],
        },
      });

      const response = await POST(request);
      apiAssertions.expectSuccess(response);

      const data = await response.json();
      expect(data.ingredients[0].name).toBe('apple');
      expect(data.ingredients[0].zone).toBe('green');
    });
  });

  describe('Error Cases', () => {
    it('should return 400 for missing ingredients field', async () => {
      const request = createMockRequest('/api/zone-ingredients', {
        method: 'POST',
        body: {},
      });

      const response = await POST(request);
      await apiAssertions.expectValidationError(response);
    });

    it('should return 400 for non-array ingredients', async () => {
      const request = createMockRequest('/api/zone-ingredients', {
        method: 'POST',
        body: {
          ingredients: 'not an array',
        },
      });

      const response = await POST(request);
      await apiAssertions.expectValidationError(response);
    });

    it('should return 503 when OpenRouter fails', async () => {
      mockCreate.mockRejectedValueOnce(new Error('OpenRouter API error'));

      const request = createMockRequest('/api/zone-ingredients', {
        method: 'POST',
        body: {
          ingredients: ['test'],
        },
      });

      const response = await POST(request);
      await apiAssertions.expectError(response, 503, 'AI_SERVICE_ERROR');
    });

    it('should return 500 when AI returns invalid JSON', async () => {
      mockCreate.mockResolvedValueOnce(
        mockOpenRouterResponse('Not valid JSON')
      );

      const request = createMockRequest('/api/zone-ingredients', {
        method: 'POST',
        body: {
          ingredients: ['test'],
        },
      });

      const response = await POST(request);
      await apiAssertions.expectError(response, 500, 'INTERNAL_SERVER_ERROR');
    });

    it('should return 500 when AI response has wrong structure', async () => {
      mockCreate.mockResolvedValueOnce(
        mockOpenRouterResponse(
          JSON.stringify({
            // Wrong structure - no ingredients array
            zones: ['green', 'yellow'],
          })
        )
      );

      const request = createMockRequest('/api/zone-ingredients', {
        method: 'POST',
        body: {
          ingredients: ['test'],
        },
      });

      const response = await POST(request);
      await apiAssertions.expectError(response, 500, 'INTERNAL_SERVER_ERROR');
    });
  });

  describe('Validation and Defaults', () => {
    it('should provide defaults for missing zone data', async () => {
      mockCreate.mockResolvedValueOnce(
        mockOpenRouterResponse(
          JSON.stringify({
            ingredients: [
              {
                name: 'mystery food',
                // Missing zone and foodGroup
              },
            ],
          })
        )
      );

      const request = createMockRequest('/api/zone-ingredients', {
        method: 'POST',
        body: {
          ingredients: ['mystery food'],
        },
      });

      const response = await POST(request);
      apiAssertions.expectSuccess(response);

      const data = await response.json();
      expect(data.ingredients[0]).toEqual({
        name: 'mystery food',
        zone: 'yellow', // Default
        foodGroup: 'other', // Default
        organic: false, // Default
      });
    });

    it('should validate zone values', async () => {
      mockCreate.mockResolvedValueOnce(
        mockOpenRouterResponse(
          JSON.stringify({
            ingredients: [
              {
                name: 'test',
                zone: 'purple', // Invalid zone
                foodGroup: 'test',
              },
            ],
          })
        )
      );

      const request = createMockRequest('/api/zone-ingredients', {
        method: 'POST',
        body: {
          ingredients: ['test'],
        },
      });

      const response = await POST(request);
      apiAssertions.expectSuccess(response);

      const data = await response.json();
      // Should default to yellow for invalid zone
      expect(data.ingredients[0].zone).toBe('yellow');
    });
  });

  describe('Rate Limiting', () => {
    it('should handle requests without rate limiting when Redis not configured', async () => {
      mockCreate.mockResolvedValue(
        mockOpenRouterResponse(
          JSON.stringify({
            ingredients: [],
          })
        )
      );

      // Make multiple rapid requests
      const requests = Array(5)
        .fill(null)
        .map(() =>
          createMockRequest('/api/zone-ingredients', {
            method: 'POST',
            body: { ingredients: ['test'] },
          })
        );

      const responses = await Promise.all(requests.map(req => POST(req)));

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
      });
    });
  });
});

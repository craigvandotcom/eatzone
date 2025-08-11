/**
 * REAL API Integration Tests
 *
 * These tests make actual HTTP requests to a running server
 * No mocks - tests the complete request/response cycle
 *
 * Prerequisites:
 * 1. Server must be running (pnpm build && pnpm start)
 * 2. .env.local must have OPENROUTER_API_KEY set
 */

describe.skip('Real API Integration Tests', () => {
  const BASE_URL = 'http://localhost:3000';

  // Helper to make real HTTP requests
  async function makeRequest(endpoint: string, options: RequestInit = {}) {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    return {
      status: response.status,
      ok: response.ok,
      data: response.headers.get('content-type')?.includes('application/json')
        ? await response.json()
        : await response.text(),
      headers: response.headers,
    };
  }

  // Test if server is running
  beforeAll(async () => {
    try {
      const response = await fetch(BASE_URL);
      if (!response.ok) {
        throw new Error(`Server not responding: ${response.status}`);
      }
    } catch (error) {
      throw new Error(
        'Server is not running. Please start it with: pnpm build && pnpm start'
      );
    }
  });

  describe('AI Status Endpoint', () => {
    it('should return AI service status', async () => {
      const result = await makeRequest('/api/ai-status');

      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('status');

      console.log('🟢 AI Status:', result.data);
    });
  });

  describe('Image Analysis Endpoint - REAL TESTS', () => {
    const testImage =
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';

    it('should analyze a 1x1 pixel image and return 200', async () => {
      const result = await makeRequest('/api/analyze-image', {
        method: 'POST',
        body: JSON.stringify({
          image: testImage,
        }),
      });

      console.log('🔍 Image Analysis Response:', {
        status: result.status,
        mealSummary: result.data?.mealSummary,
        ingredientCount: result.data?.ingredients?.length,
      });

      // The actual endpoint should work
      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('mealSummary');
      expect(result.data).toHaveProperty('ingredients');
      expect(Array.isArray(result.data.ingredients)).toBe(true);
    });

    it('should return 400 for missing image data', async () => {
      const result = await makeRequest('/api/analyze-image', {
        method: 'POST',
        body: JSON.stringify({}), // No image field
      });

      expect(result.status).toBe(400);
      expect(result.data.error).toHaveProperty('message');
      expect(result.data.error.code).toBe('VALIDATION_ERROR');

      console.log('🔴 Validation Error (expected):', result.data.error.message);
    });

    it('should return 400 for invalid image format', async () => {
      const result = await makeRequest('/api/analyze-image', {
        method: 'POST',
        body: JSON.stringify({
          image: 'not-a-valid-image-url',
        }),
      });

      expect(result.status).toBe(400);
      expect(result.data.error.code).toBe('INVALID_IMAGE_FORMAT');

      console.log('🔴 Format Error (expected):', result.data.error.message);
    });
  });

  describe('Zone Ingredients Endpoint - REAL TESTS', () => {
    it('should zone real ingredients', async () => {
      const result = await makeRequest('/api/zone-ingredients', {
        method: 'POST',
        body: JSON.stringify({
          ingredients: ['spinach', 'white bread', 'olive oil'],
        }),
      });

      console.log('🎯 Ingredient Zoning Response:', {
        status: result.status,
        ingredientCount: result.data?.ingredients?.length,
        zones: result.data?.ingredients?.map(
          (i: any) => `${i.name}: ${i.zone}`
        ),
      });

      expect(result.status).toBe(200);
      expect(result.data).toHaveProperty('ingredients');
      expect(result.data.ingredients).toHaveLength(3);

      // Each ingredient should have required properties
      result.data.ingredients.forEach((ingredient: any) => {
        expect(ingredient).toHaveProperty('name');
        expect(ingredient).toHaveProperty('zone');
        expect(['green', 'yellow', 'red']).toContain(ingredient.zone);
      });
    });

    it('should handle empty ingredient list', async () => {
      const result = await makeRequest('/api/zone-ingredients', {
        method: 'POST',
        body: JSON.stringify({
          ingredients: [],
        }),
      });

      expect(result.status).toBe(200);
      expect(result.data.ingredients).toEqual([]);
    });

    it('should return 400 for invalid input', async () => {
      const result = await makeRequest('/api/zone-ingredients', {
        method: 'POST',
        body: JSON.stringify({
          ingredients: 'not-an-array',
        }),
      });

      expect(result.status).toBe(400);
      expect(result.data.error.code).toBe('VALIDATION_ERROR');
    });
  });

  describe('Middleware Behavior - REAL TESTS', () => {
    it('should allow access to API routes without authentication', async () => {
      // These should work without any auth headers
      const endpoints = [
        '/api/ai-status',
        '/api/analyze-image',
        '/api/zone-ingredients',
      ];

      for (const endpoint of endpoints) {
        const result = await makeRequest(endpoint, {
          method:
            endpoint.includes('analyze') || endpoint.includes('zone')
              ? 'POST'
              : 'GET',
          body: endpoint.includes('analyze')
            ? JSON.stringify({ image: 'test' })
            : endpoint.includes('zone')
              ? JSON.stringify({ ingredients: [] })
              : undefined,
        });

        // Should not redirect to login (307) and should not be unauthorized (401)
        expect([200, 400, 503]).toContain(result.status); // 400/503 are valid API errors
        expect(result.status).not.toBe(307); // Not a redirect
        expect(result.status).not.toBe(401); // Not unauthorized

        console.log(`✅ ${endpoint} accessible:`, result.status);
      }
    });
  });
});

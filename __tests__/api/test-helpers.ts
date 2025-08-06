/**
 * Test helpers for Next.js API Route testing
 */

import { NextRequest } from 'next/server';
import { headers } from 'next/headers';

/**
 * Creates a mock NextRequest for testing API routes
 */
export function createMockRequest(
  url: string,
  options: {
    method?: string;
    body?: any;
    headers?: Record<string, string>;
    searchParams?: Record<string, string>;
  } = {}
): NextRequest {
  const {
    method = 'GET',
    body,
    headers: customHeaders = {},
    searchParams = {},
  } = options;

  // Build URL with search params
  const urlObj = new URL(url, 'http://localhost:3000');
  Object.entries(searchParams).forEach(([key, value]) => {
    urlObj.searchParams.set(key, value);
  });

  // Create request init
  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...customHeaders,
    },
  };

  // Add body if provided
  if (body !== undefined) {
    init.body = typeof body === 'string' ? body : JSON.stringify(body);
  }

  return new NextRequest(urlObj.toString(), init);
}

/**
 * Helper to parse response body based on content type
 */
export async function parseResponse(response: Response) {
  const contentType = response.headers.get('content-type');

  if (contentType?.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

/**
 * Test environment setup for API routes
 */
export function setupApiTestEnvironment(envVars: Record<string, string> = {}) {
  const originalEnv = { ...process.env };

  beforeAll(() => {
    // Set test environment variables
    Object.entries(envVars).forEach(([key, value]) => {
      process.env[key] = value;
    });
  });

  afterAll(() => {
    // Restore original environment
    Object.keys(envVars).forEach(key => {
      if (originalEnv[key] !== undefined) {
        process.env[key] = originalEnv[key];
      } else {
        delete process.env[key];
      }
    });
  });
}

/**
 * Creates a test image data URL
 */
export function createTestImageDataUrl(
  type: 'valid' | 'invalid' | 'empty' = 'valid'
): string {
  switch (type) {
    case 'valid':
      // 1x1 red pixel PNG
      return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
    case 'invalid':
      return 'not-a-valid-data-url';
    case 'empty':
      return '';
  }
}

/**
 * Mock OpenRouter response for testing
 */
export function mockOpenRouterResponse(content: string, error?: Error) {
  if (error) {
    return Promise.reject(error);
  }

  return Promise.resolve({
    choices: [
      {
        message: {
          content,
          role: 'assistant',
        },
        finish_reason: 'stop',
        index: 0,
      },
    ],
    id: 'test-completion-id',
    model: 'openai/gpt-4o',
    object: 'chat.completion',
    created: Date.now(),
    usage: {
      prompt_tokens: 100,
      completion_tokens: 50,
      total_tokens: 150,
    },
  });
}

/**
 * Assertion helpers for common API response patterns
 */
export const apiAssertions = {
  expectSuccess(response: Response, expectedStatus = 200) {
    expect(response.status).toBe(expectedStatus);
    expect(response.ok).toBe(true);
  },

  expectError(
    response: Response,
    expectedStatus: number,
    expectedCode?: string
  ) {
    expect(response.status).toBe(expectedStatus);
    expect(response.ok).toBe(false);
    return response.json().then((data: any) => {
      expect(data).toHaveProperty('error');
      expect(data.error).toHaveProperty('message');
      expect(data.error).toHaveProperty('statusCode', expectedStatus);
      if (expectedCode) {
        expect(data.error).toHaveProperty('code', expectedCode);
      }
    });
  },

  async expectValidationError(response: Response) {
    await this.expectError(response, 400, 'VALIDATION_ERROR');
  },

  async expectAuthError(response: Response) {
    await this.expectError(response, 503, 'AI_AUTH_ERROR');
  },

  async expectRateLimitError(response: Response) {
    await this.expectError(response, 429, 'RATE_LIMIT_EXCEEDED');
  },
};

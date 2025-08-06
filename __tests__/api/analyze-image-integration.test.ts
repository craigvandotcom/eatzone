/**
 * Integration test using real HTTP requests but controlled environment
 * This tests the complete request/response cycle
 */

import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';

// Mock the expensive external dependencies
jest.mock('@/lib/ai/openrouter', () => ({
  openrouter: {
    chat: {
      completions: {
        create: jest.fn(),
      },
    },
  },
}));

describe('/api/analyze-image Integration Tests', () => {
  let server: any;
  let app: any;
  const port = 3001;

  beforeAll(async () => {
    // Create a real Next.js server for testing
    const dev = process.env.NODE_ENV !== 'production';
    app = next({ dev, dir: './', port });
    const handle = app.getRequestHandler();

    await app.prepare();

    server = createServer(async (req, res) => {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    });

    await new Promise<void>(resolve => {
      server.listen(port, () => resolve());
    });
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
    if (app) {
      await app.close();
    }
  });

  it('should handle real HTTP request with mocked AI response', async () => {
    // Mock the AI response (to avoid costs)
    const { openrouter } = require('@/lib/ai/openrouter');
    openrouter.chat.completions.create.mockResolvedValueOnce({
      choices: [
        {
          message: {
            content: JSON.stringify({
              mealSummary: 'test meal',
              ingredients: [{ name: 'apple', isOrganic: false }],
            }),
          },
        },
      ],
    });

    // Make REAL HTTP request to our server
    const response = await fetch(`http://localhost:${port}/api/analyze-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image:
          'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
      }),
    });

    // Test the REAL response
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual({
      mealSummary: 'test meal',
      ingredients: [{ name: 'apple', isOrganic: false }],
    });
  });

  it('should return proper error for invalid requests', async () => {
    // Make REAL HTTP request with invalid data
    const response = await fetch(`http://localhost:${port}/api/analyze-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Missing image field
      }),
    });

    expect(response.status).toBe(400);

    const data = await response.json();
    expect(data.error.code).toBe('VALIDATION_ERROR');
  });
});

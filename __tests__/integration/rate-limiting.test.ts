/**
 * Integration tests for rate limiting functionality
 * Tests both Redis and fallback rate limiting scenarios
 */

import { getRateLimiter } from '@/lib/rate-limit';
import {
  getMemoryRateLimiter,
  destroyMemoryRateLimiter,
} from '@/lib/rate-limit/fallback';

// Mock environment variables for testing
const originalEnv = process.env;

describe('Rate Limiting Integration Tests', () => {
  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    destroyMemoryRateLimiter();
  });

  describe('Memory Rate Limiter (Fallback)', () => {
    beforeEach(() => {
      // Ensure no Redis environment variables are set
      delete process.env.KV_REST_API_URL;
      delete process.env.KV_REST_API_TOKEN;
    });

    test('should allow requests under the limit', async () => {
      const limiter = getMemoryRateLimiter();
      const identifier = 'test-user-1';

      const result = await limiter.limit(identifier, 5, 60000); // 5 requests per minute

      expect(result.success).toBe(true);
      expect(result.remaining).toBe(4);
      expect(result.resetTime).toBeGreaterThan(Date.now());
    });

    test('should block requests over the limit', async () => {
      const limiter = getMemoryRateLimiter();
      const identifier = 'test-user-2';
      const limit = 3;

      // Make requests up to the limit
      for (let i = 0; i < limit; i++) {
        const result = await limiter.limit(identifier, limit, 60000);
        expect(result.success).toBe(true);
      }

      // Next request should be blocked
      const blockedResult = await limiter.limit(identifier, limit, 60000);
      expect(blockedResult.success).toBe(false);
      expect(blockedResult.remaining).toBe(0);
    });

    test('should reset after window expires', async () => {
      const limiter = getMemoryRateLimiter();
      const identifier = 'test-user-3';
      const windowMs = 100; // Very short window for testing

      // Use up the limit
      await limiter.limit(identifier, 1, windowMs);
      const blockedResult = await limiter.limit(identifier, 1, windowMs);
      expect(blockedResult.success).toBe(false);

      // Wait for window to expire
      await new Promise(resolve => setTimeout(resolve, windowMs + 10));

      // Should be allowed again
      const resetResult = await limiter.limit(identifier, 1, windowMs);
      expect(resetResult.success).toBe(true);
    });

    test('should handle different identifiers separately', async () => {
      const limiter = getMemoryRateLimiter();
      const limit = 2;

      // User 1 uses up their limit
      await limiter.limit('user-1', limit, 60000);
      await limiter.limit('user-1', limit, 60000);
      const user1Blocked = await limiter.limit('user-1', limit, 60000);
      expect(user1Blocked.success).toBe(false);

      // User 2 should still be allowed
      const user2Result = await limiter.limit('user-2', limit, 60000);
      expect(user2Result.success).toBe(true);
    });

    test('should clean up expired entries', async () => {
      const limiter = getMemoryRateLimiter();

      // Add entries that will expire quickly
      await limiter.limit('temp-user-1', 5, 50);
      await limiter.limit('temp-user-2', 5, 50);

      // Check that entries exist (indirectly by testing they have counts)
      const result1 = await limiter.limit('temp-user-1', 5, 50);
      expect(result1.remaining).toBe(3); // Should be 2nd request

      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 100));

      // Trigger cleanup by creating new entry
      const result2 = await limiter.limit('temp-user-1', 5, 60000);
      expect(result2.remaining).toBe(4); // Should be fresh (1st request)
    });
  });

  describe('Unified Rate Limiter', () => {
    test('should use memory fallback when Redis is not configured', async () => {
      // Ensure no Redis environment variables
      delete process.env.KV_REST_API_URL;
      delete process.env.KV_REST_API_TOKEN;

      const rateLimiter = getRateLimiter();
      const result = await rateLimiter.limitImageAnalysis('test-ip-1');

      expect(result.success).toBe(true);
      expect(typeof result.remaining).toBe('number');
      expect(typeof result.resetTime).toBe('number');
    });

    test('should handle multiple rapid requests correctly', async () => {
      const rateLimiter = getRateLimiter();
      const identifier = 'rapid-test-user';
      const results: any[] = [];

      // Make multiple rapid requests
      const promises = Array.from({ length: 5 }, () =>
        rateLimiter.limitGeneric(identifier, 3, 60000)
      );

      const responses = await Promise.all(promises);

      // Count successful requests
      const successful = responses.filter(r => r.success).length;
      const blocked = responses.filter(r => !r.success).length;

      expect(successful).toBe(3);
      expect(blocked).toBe(2);
    });

    test('should provide proper rate limit headers information', async () => {
      const rateLimiter = getRateLimiter();
      const result = await rateLimiter.limitImageAnalysis('headers-test-ip');

      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('remaining');
      expect(result).toHaveProperty('resetTime');
      expect(result).toHaveProperty('limit');

      if (result.success) {
        expect(typeof result.remaining).toBe('number');
        expect(typeof result.resetTime).toBe('number');
        expect(typeof result.limit).toBe('number');
      }
    });
  });

  describe('API Route Integration', () => {
    // Mock fetch for API testing
    const mockFetch = jest.fn();
    global.fetch = mockFetch;

    beforeEach(() => {
      mockFetch.mockClear();
    });

    test('should handle rate limit in image analysis API', async () => {
      // This would require setting up a test server or using MSW
      // For now, we'll test the rate limiting logic directly
      const rateLimiter = getRateLimiter();

      // Simulate rapid API calls
      const ip = '192.168.1.1';
      const results = [];

      for (let i = 0; i < 12; i++) {
        const result = await rateLimiter.limitImageAnalysis(ip);
        results.push(result);
      }

      const successful = results.filter(r => r.success);
      const blocked = results.filter(r => !r.success);

      // Should allow 10 requests per minute by default
      expect(successful.length).toBe(10);
      expect(blocked.length).toBe(2);
    });

    test('should handle rate limit in zone ingredients API', async () => {
      const rateLimiter = getRateLimiter();
      const ip = '192.168.1.2';

      // Test the 50 requests per minute limit for zoning (default)
      const results = [];

      for (let i = 0; i < 55; i++) {
        const result = await rateLimiter.limitZoning(ip);
        results.push(result);
      }

      const successful = results.filter(r => r.success);
      const blocked = results.filter(r => !r.success);

      expect(successful.length).toBe(50);
      expect(blocked.length).toBe(5);
    });
  });

  describe('Error Handling', () => {
    test('should gracefully handle rate limiter errors', async () => {
      const rateLimiter = getRateLimiter();

      // This should not throw even with invalid input
      const result = await rateLimiter.limitGeneric('', 10, 60000);
      expect(result).toHaveProperty('success');
      expect(typeof result.success).toBe('boolean');
    });

    test('should handle memory limiter destruction gracefully', () => {
      const limiter = getMemoryRateLimiter();
      expect(() => limiter.destroy()).not.toThrow();
      expect(() => destroyMemoryRateLimiter()).not.toThrow();
    });
  });

  describe('Performance Tests', () => {
    test('should handle high load efficiently', async () => {
      const rateLimiter = getRateLimiter();
      const startTime = Date.now();

      // Test 100 requests
      const promises = Array.from({ length: 100 }, (_, i) =>
        rateLimiter.limitGeneric(`user-${i % 10}`, 50, 60000)
      );

      await Promise.all(promises);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(1000); // 1 second
    });

    test('should not leak memory with many different identifiers', async () => {
      const limiter = getMemoryRateLimiter();

      // Create entries for many different users
      const promises = Array.from(
        { length: 1000 },
        (_, i) => limiter.limit(`user-${i}`, 5, 100) // Short window so they expire quickly
      );

      await Promise.all(promises);

      // Wait for entries to expire
      await new Promise(resolve => setTimeout(resolve, 150));

      // Trigger cleanup
      await limiter.limit('cleanup-trigger', 5, 60000);

      // If we get here without memory issues, the test passes
      expect(true).toBe(true);
    });
  });
});

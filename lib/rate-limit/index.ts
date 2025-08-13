/**
 * Unified rate limiting interface with Redis and fallback support
 */

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { getMemoryRateLimiter } from './fallback';
import { APP_CONFIG } from '@/lib/config/constants';
import { logger } from '@/lib/utils/logger';

interface RateLimitResult {
  success: boolean;
  remaining?: number;
  resetTime?: number;
  limit?: number;
}

class UnifiedRateLimiter {
  private redisRateLimit: Ratelimit | null = null;
  private useRedis: boolean = false;

  constructor() {
    this.initializeRedis();
  }

  private initializeRedis() {
    // Only use Redis if both URL and token are provided
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      try {
        this.redisRateLimit = new Ratelimit({
          redis: new Redis({
            url: process.env.KV_REST_API_URL,
            token: process.env.KV_REST_API_TOKEN,
          }),
          limiter: Ratelimit.slidingWindow(
            APP_CONFIG.RATE_LIMIT.IMAGE_ANALYSIS_REQUESTS_PER_MINUTE,
            APP_CONFIG.RATE_LIMIT.RATE_LIMIT_WINDOW
          ),
        });
        this.useRedis = true;
        logger.info('Rate limiting: Redis backend initialized');
      } catch (error) {
        logger.error(
          'Rate limiting: Redis initialization failed, using fallback',
          error
        );
        this.useRedis = false;
      }
    } else {
      logger.info(
        'Rate limiting: Redis credentials not found, using memory fallback'
      );
      this.useRedis = false;
    }
  }

  async limitImageAnalysis(identifier: string): Promise<RateLimitResult> {
    return this.limit(
      identifier,
      APP_CONFIG.RATE_LIMIT.IMAGE_ANALYSIS_REQUESTS_PER_MINUTE,
      60 * 1000 // 60 seconds in milliseconds
    );
  }

  private async limit(
    identifier: string,
    limit: number,
    windowMs: number
  ): Promise<RateLimitResult> {
    if (this.useRedis && this.redisRateLimit) {
      try {
        const result = await this.redisRateLimit.limit(identifier);
        return {
          success: result.success,
          remaining: result.remaining,
          resetTime: result.reset,
          limit: result.limit,
        };
      } catch (error) {
        logger.error('Redis rate limit error, falling back to memory', error);
        // Fall through to memory limiter
      }
    }

    // Use memory-based fallback
    const memoryLimiter = getMemoryRateLimiter();
    const result = await memoryLimiter.limit(identifier, limit, windowMs);

    return {
      success: result.success,
      remaining: result.remaining,
      resetTime: result.resetTime,
      limit,
    };
  }

  async limitGeneric(
    identifier: string,
    limit: number,
    windowMs: number
  ): Promise<RateLimitResult> {
    return this.limit(identifier, limit, windowMs);
  }
}

// Export singleton instance
let rateLimiter: UnifiedRateLimiter | null = null;

export function getRateLimiter(): UnifiedRateLimiter {
  if (!rateLimiter) {
    rateLimiter = new UnifiedRateLimiter();
  }
  return rateLimiter;
}

export type { RateLimitResult };

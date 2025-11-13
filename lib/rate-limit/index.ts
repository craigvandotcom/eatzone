/**
 * Unified rate limiting interface with Redis and fallback support
 * Uses separate Redis limiters for different endpoint types to enforce correct limits
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
  private redis: Redis | null = null;
  private redisImageAnalysisLimiter: Ratelimit | null = null;
  private redisZoningLimiter: Ratelimit | null = null;
  private useRedis: boolean = false;

  constructor() {
    this.initializeRedis();
  }

  private initializeRedis() {
    // Only use Redis if both URL and token are provided
    if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
      try {
        this.redis = new Redis({
          url: process.env.KV_REST_API_URL,
          token: process.env.KV_REST_API_TOKEN,
        });

        // Image analysis: expensive vision AI - strict limit (10/minute)
        this.redisImageAnalysisLimiter = new Ratelimit({
          redis: this.redis,
          limiter: Ratelimit.slidingWindow(
            APP_CONFIG.RATE_LIMIT.IMAGE_ANALYSIS_REQUESTS_PER_MINUTE,
            APP_CONFIG.RATE_LIMIT.RATE_LIMIT_WINDOW
          ),
          prefix: 'ratelimit:image-analysis',
        });

        // Ingredient zoning: text AI - higher limit (50/minute)
        this.redisZoningLimiter = new Ratelimit({
          redis: this.redis,
          limiter: Ratelimit.slidingWindow(
            APP_CONFIG.RATE_LIMIT.ZONING_REQUESTS_PER_MINUTE,
            APP_CONFIG.RATE_LIMIT.RATE_LIMIT_WINDOW
          ),
          prefix: 'ratelimit:zoning',
        });

        this.useRedis = true;
        logger.info(
          'Rate limiting: Redis backend initialized with separate limiters',
          {
            imageAnalysisLimit:
              APP_CONFIG.RATE_LIMIT.IMAGE_ANALYSIS_REQUESTS_PER_MINUTE,
            zoningLimit: APP_CONFIG.RATE_LIMIT.ZONING_REQUESTS_PER_MINUTE,
          }
        );
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
    if (this.useRedis && this.redisImageAnalysisLimiter) {
      try {
        const result = await this.redisImageAnalysisLimiter.limit(identifier);
        logger.debug('Image analysis rate limit check (Redis)', {
          identifier,
          success: result.success,
          remaining: result.remaining,
          limit: result.limit,
        });
        return {
          success: result.success,
          remaining: result.remaining,
          resetTime: result.reset,
          limit: result.limit,
        };
      } catch (error) {
        logger.error(
          'Redis image analysis rate limit error, falling back to memory',
          error
        );
        // Fall through to memory limiter
      }
    }

    // Use memory-based fallback
    const memoryLimiter = getMemoryRateLimiter();
    const result = await memoryLimiter.limit(
      identifier,
      APP_CONFIG.RATE_LIMIT.IMAGE_ANALYSIS_REQUESTS_PER_MINUTE,
      60 * 1000
    );

    return {
      success: result.success,
      remaining: result.remaining,
      resetTime: result.resetTime,
      limit: APP_CONFIG.RATE_LIMIT.IMAGE_ANALYSIS_REQUESTS_PER_MINUTE,
    };
  }

  async limitZoning(identifier: string): Promise<RateLimitResult> {
    if (this.useRedis && this.redisZoningLimiter) {
      try {
        const result = await this.redisZoningLimiter.limit(identifier);
        logger.debug('Zoning rate limit check (Redis)', {
          identifier,
          success: result.success,
          remaining: result.remaining,
          limit: result.limit,
        });
        return {
          success: result.success,
          remaining: result.remaining,
          resetTime: result.reset,
          limit: result.limit,
        };
      } catch (error) {
        logger.error(
          'Redis zoning rate limit error, falling back to memory',
          error
        );
        // Fall through to memory limiter
      }
    }

    // Use memory-based fallback
    const memoryLimiter = getMemoryRateLimiter();
    const result = await memoryLimiter.limit(
      identifier,
      APP_CONFIG.RATE_LIMIT.ZONING_REQUESTS_PER_MINUTE,
      60 * 1000
    );

    return {
      success: result.success,
      remaining: result.remaining,
      resetTime: result.resetTime,
      limit: APP_CONFIG.RATE_LIMIT.ZONING_REQUESTS_PER_MINUTE,
    };
  }

  async limitGeneric(
    identifier: string,
    limit: number,
    windowMs: number
  ): Promise<RateLimitResult> {
    // For generic limits, always use memory limiter for simplicity
    // This is used for upload validation and other endpoints
    const memoryLimiter = getMemoryRateLimiter();
    const result = await memoryLimiter.limit(identifier, limit, windowMs);

    return {
      success: result.success,
      remaining: result.remaining,
      resetTime: result.resetTime,
      limit,
    };
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

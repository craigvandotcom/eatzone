/**
 * Fallback rate limiting for development environments
 * Uses in-memory storage when Redis is unavailable
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class MemoryRateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      5 * 60 * 1000
    );
  }

  private cleanup() {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now > entry.resetTime) {
        this.store.delete(key);
      }
    }
  }

  async limit(
    identifier: string,
    limit: number,
    windowMs: number
  ): Promise<{ success: boolean; remaining: number; resetTime: number }> {
    const now = Date.now();
    const resetTime = now + windowMs;

    const existing = this.store.get(identifier);

    if (!existing || now > existing.resetTime) {
      // First request or window expired
      this.store.set(identifier, { count: 1, resetTime });
      return {
        success: true,
        remaining: limit - 1,
        resetTime,
      };
    }

    if (existing.count >= limit) {
      // Rate limit exceeded
      return {
        success: false,
        remaining: 0,
        resetTime: existing.resetTime,
      };
    }

    // Increment count
    existing.count++;
    this.store.set(identifier, existing);

    return {
      success: true,
      remaining: limit - existing.count,
      resetTime: existing.resetTime,
    };
  }

  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.store.clear();
  }
}

// Global instance for development use
let memoryLimiter: MemoryRateLimiter | null = null;

export function getMemoryRateLimiter(): MemoryRateLimiter {
  if (!memoryLimiter) {
    memoryLimiter = new MemoryRateLimiter();
  }
  return memoryLimiter;
}

export function destroyMemoryRateLimiter() {
  if (memoryLimiter) {
    memoryLimiter.destroy();
    memoryLimiter = null;
  }
}

export type { RateLimitEntry };

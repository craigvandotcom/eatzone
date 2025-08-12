/**
 * AI Service Performance Monitoring
 * Tracks response times, success rates, and service health
 */

import { logger } from '@/lib/utils/logger';

export interface AIPerformanceMetrics {
  service: 'image-analysis' | 'ingredient-zoning';
  startTime: number;
  endTime?: number;
  duration?: number;
  success: boolean;
  error?: string;
  tokenUsage?: {
    prompt: number;
    completion: number;
    total: number;
  };
  model?: string;
  requestSize?: number;
  responseSize?: number;
}

interface ServiceStats {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalDuration: number;
  averageResponseTime: number;
  lastHourRequests: Array<{
    timestamp: number;
    success: boolean;
    duration: number;
  }>;
  errorCounts: Record<string, number>;
}

class AIPerformanceMonitor {
  private metrics: Map<string, ServiceStats> = new Map();
  private readonly maxHistorySize = 1000;
  private readonly cleanupIntervalMs = 60 * 60 * 1000; // 1 hour

  constructor() {
    // Initialize service stats
    this.metrics.set('image-analysis', this.createEmptyStats());
    this.metrics.set('ingredient-zoning', this.createEmptyStats());

    // Set up periodic cleanup
    setInterval(() => this.cleanup(), this.cleanupIntervalMs);
  }

  private createEmptyStats(): ServiceStats {
    return {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      totalDuration: 0,
      averageResponseTime: 0,
      lastHourRequests: [],
      errorCounts: {},
    };
  }

  /**
   * Start tracking a new AI service request
   */
  startRequest(service: AIPerformanceMetrics['service']): string {
    const requestId = `${service}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const startTime = Date.now();

    logger.debug('AI performance tracking started', {
      requestId,
      service,
      startTime,
    });

    return requestId;
  }

  /**
   * Complete tracking for a request
   */
  endRequest(
    requestId: string,
    metrics: Omit<AIPerformanceMetrics, 'startTime'>
  ): void {
    const endTime = Date.now();
    const startTime = this.extractStartTimeFromId(requestId);
    const duration = endTime - startTime;

    const completeMetrics: AIPerformanceMetrics = {
      ...metrics,
      startTime,
      endTime,
      duration,
    };

    this.recordMetrics(completeMetrics);

    logger.debug('AI performance tracking completed', {
      requestId,
      ...completeMetrics,
    });
  }

  private extractStartTimeFromId(requestId: string): number {
    const parts = requestId.split('-');
    return parseInt(parts[1], 10);
  }

  private recordMetrics(metrics: AIPerformanceMetrics): void {
    const stats = this.metrics.get(metrics.service);
    if (!stats) {
      logger.error('Unknown service in performance metrics', undefined, {
        service: metrics.service,
      });
      return;
    }

    // Update basic counters
    stats.totalRequests++;
    if (metrics.success) {
      stats.successfulRequests++;
    } else {
      stats.failedRequests++;

      // Track error types
      if (metrics.error) {
        stats.errorCounts[metrics.error] =
          (stats.errorCounts[metrics.error] || 0) + 1;
      }
    }

    // Update timing stats
    if (metrics.duration) {
      stats.totalDuration += metrics.duration;
      stats.averageResponseTime = stats.totalDuration / stats.totalRequests;

      // Keep last hour of requests for detailed analysis
      stats.lastHourRequests.push({
        timestamp: metrics.endTime || Date.now(),
        success: metrics.success,
        duration: metrics.duration,
      });
    }

    // Log performance warnings
    this.checkPerformanceWarnings(metrics, stats);
  }

  private checkPerformanceWarnings(
    metrics: AIPerformanceMetrics,
    stats: ServiceStats
  ): void {
    // Slow response warning
    if (metrics.duration && metrics.duration > 10000) {
      // 10 seconds
      logger.warn('Slow AI response detected', {
        service: metrics.service,
        duration: metrics.duration,
        model: metrics.model,
      });
    }

    // High error rate warning
    const recentFailureRate = this.getRecentFailureRate(stats);
    if (recentFailureRate > 0.2 && stats.totalRequests > 10) {
      // 20% failure rate
      logger.warn('High AI service failure rate detected', {
        service: metrics.service,
        failureRate: recentFailureRate,
        totalRequests: stats.totalRequests,
        failedRequests: stats.failedRequests,
      });
    }
  }

  private getRecentFailureRate(stats: ServiceStats): number {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentRequests = stats.lastHourRequests.filter(
      r => r.timestamp > oneHourAgo
    );

    if (recentRequests.length === 0) return 0;

    const failedCount = recentRequests.filter(r => !r.success).length;
    return failedCount / recentRequests.length;
  }

  /**
   * Get current performance stats for a service
   */
  getServiceStats(
    service: AIPerformanceMetrics['service']
  ): ServiceStats | null {
    return this.metrics.get(service) || null;
  }

  /**
   * Get comprehensive health summary
   */
  getHealthSummary(): Record<string, unknown> {
    const summary: Record<string, unknown> = {};

    for (const [service, stats] of this.metrics.entries()) {
      const recentFailureRate = this.getRecentFailureRate(stats);
      const recentRequests = stats.lastHourRequests.filter(
        r => r.timestamp > Date.now() - 60 * 60 * 1000
      );

      summary[service] = {
        totalRequests: stats.totalRequests,
        successRate:
          stats.totalRequests > 0
            ? stats.successfulRequests / stats.totalRequests
            : 0,
        averageResponseTime: Math.round(stats.averageResponseTime),
        recentFailureRate,
        requestsLastHour: recentRequests.length,
        topErrors: Object.entries(stats.errorCounts)
          .sort(([, a], [, b]) => b - a)
          .slice(0, 3)
          .map(([error, count]) => ({ error, count })),
      };
    }

    return summary;
  }

  /**
   * Clean up old performance data
   */
  private cleanup(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;

    for (const stats of this.metrics.values()) {
      stats.lastHourRequests = stats.lastHourRequests
        .filter(r => r.timestamp > oneHourAgo)
        .slice(-this.maxHistorySize);
    }

    logger.debug('AI performance metrics cleanup completed');
  }

  /**
   * Reset all metrics (useful for testing)
   */
  reset(): void {
    for (const service of this.metrics.keys()) {
      this.metrics.set(service, this.createEmptyStats());
    }
    logger.debug('AI performance metrics reset');
  }

  /**
   * Export metrics for external monitoring systems
   */
  exportMetrics(): Record<string, ServiceStats> {
    return Object.fromEntries(this.metrics.entries());
  }
}

// Singleton instance
const aiPerformanceMonitor = new AIPerformanceMonitor();

export { aiPerformanceMonitor };

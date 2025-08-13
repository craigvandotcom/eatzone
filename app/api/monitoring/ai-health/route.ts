/**
 * AI Service Health Monitoring Endpoint
 * Provides real-time health status and performance metrics
 */

import { NextResponse } from 'next/server';
import { aiPerformanceMonitor } from '@/lib/monitoring/ai-performance';
import { logger } from '@/lib/utils/logger';

export async function GET() {
  try {
    logger.debug('AI health check requested');

    // Get comprehensive health summary
    const healthSummary = aiPerformanceMonitor.getHealthSummary();

    // Calculate overall health status
    const overallHealth = calculateOverallHealth(healthSummary);

    // Add system information
    const systemInfo = {
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      nodeVersion: process.version,
      environment: process.env.NODE_ENV || 'development',
    };

    const response = {
      status: overallHealth.status,
      services: healthSummary,
      system: systemInfo,
      summary: {
        healthScore: overallHealth.score,
        issues: overallHealth.issues,
        recommendations: overallHealth.recommendations,
      },
    };

    logger.debug('AI health check completed', {
      status: overallHealth.status,
      healthScore: overallHealth.score,
    });

    return NextResponse.json(response, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
        Expires: '0',
      },
    });
  } catch (error) {
    logger.error('AI health check failed', error);

    return NextResponse.json(
      {
        status: 'error',
        error: 'Health check failed',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

interface HealthAssessment {
  status: 'healthy' | 'degraded' | 'unhealthy' | 'error';
  score: number; // 0-100
  issues: string[];
  recommendations: string[];
}

function calculateOverallHealth(
  healthSummary: Record<string, unknown>
): HealthAssessment {
  const issues: string[] = [];
  const recommendations: string[] = [];
  let totalScore = 100;

  for (const [service, statsData] of Object.entries(healthSummary)) {
    const stats = statsData as {
      successRate: number;
      totalRequests: number;
      averageResponseTime: number;
      recentFailureRate: number;
      requestsLastHour: number;
      topErrors?: Array<{ error: string; count: number }>;
    };

    // Check success rate
    if (stats.successRate < 0.95 && stats.totalRequests > 10) {
      issues.push(
        `${service} has low success rate: ${Math.round(stats.successRate * 100)}%`
      );
      totalScore -= 15;
      recommendations.push(
        `Investigate ${service} failures and improve error handling`
      );
    }

    // Check response times
    if (stats.averageResponseTime > 8000) {
      // 8 seconds
      issues.push(
        `${service} has slow response times: ${stats.averageResponseTime}ms`
      );
      totalScore -= 10;
      recommendations.push(
        `Optimize ${service} performance or consider timeout adjustments`
      );
    } else if (stats.averageResponseTime > 5000) {
      // 5 seconds
      issues.push(
        `${service} response times are elevated: ${stats.averageResponseTime}ms`
      );
      totalScore -= 5;
      recommendations.push(`Monitor ${service} performance trends`);
    }

    // Check recent failure rate
    if (stats.recentFailureRate > 0.1 && stats.requestsLastHour > 5) {
      issues.push(
        `${service} recent failure rate is high: ${Math.round(stats.recentFailureRate * 100)}%`
      );
      totalScore -= 20;
      recommendations.push(
        `Immediate attention needed for ${service} reliability`
      );
    }

    // Check if service is being used
    if (stats.totalRequests === 0) {
      issues.push(`${service} has no recorded usage`);
      recommendations.push(
        `Verify ${service} is properly integrated and accessible`
      );
    }

    // Check for error patterns
    if (stats.topErrors && stats.topErrors.length > 0) {
      const topError = stats.topErrors[0];
      if (topError.count > stats.totalRequests * 0.1) {
        issues.push(
          `${service} has frequent errors: ${topError.error} (${topError.count} times)`
        );
        totalScore -= 8;
        recommendations.push(
          `Address common error pattern in ${service}: ${topError.error}`
        );
      }
    }
  }

  // Determine overall status
  let status: HealthAssessment['status'];
  if (totalScore >= 90) {
    status = 'healthy';
  } else if (totalScore >= 70) {
    status = 'degraded';
  } else if (totalScore >= 50) {
    status = 'unhealthy';
  } else {
    status = 'error';
  }

  // Add general recommendations
  if (status !== 'healthy') {
    if (issues.length > 3) {
      recommendations.push(
        'Consider implementing circuit breaker pattern for AI services'
      );
    }
    if (
      Object.keys(healthSummary).some(service => {
        const serviceStats = healthSummary[service] as {
          averageResponseTime: number;
        };
        return serviceStats.averageResponseTime > 6000;
      })
    ) {
      recommendations.push(
        'Consider implementing request timeouts and retry logic'
      );
    }
  }

  return {
    status,
    score: Math.max(0, Math.min(100, totalScore)),
    issues,
    recommendations,
  };
}

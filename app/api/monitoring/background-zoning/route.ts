import { NextResponse } from 'next/server';
import { getMonitoringInfo } from '@/lib/background-zoning';
import { logger } from '@/lib/utils/logger';

/**
 * API endpoint for monitoring background zoning health
 * Returns statistics about stuck/failed zoning operations
 */
export async function GET() {
  try {
    logger.info('Background zoning monitoring request received');

    const monitoringData = await getMonitoringInfo();

    return NextResponse.json(
      {
        status: 'ok',
        data: monitoringData,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Background zoning monitoring failed', error);

    return NextResponse.json(
      {
        status: 'error',
        error: {
          message: 'Failed to fetch monitoring information',
          code: 'MONITORING_ERROR',
          statusCode: 500,
        },
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

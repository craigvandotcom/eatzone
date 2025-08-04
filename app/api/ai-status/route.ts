import { NextResponse } from 'next/server';
import { openrouter } from '@/lib/ai/openrouter';
import { logger } from '@/lib/utils/logger';
import { requireAuth } from '@/lib/auth/api';

export const dynamic = 'force-dynamic'; // defaults to auto

export async function GET(_request: Request) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    // We use a lightweight, free model for a simple health check.
    // This confirms API key validity and connectivity to OpenRouter.
    const response = await openrouter.chat.completions.create({
      model: 'mistralai/mistral-7b-instruct:free',
      messages: [{ role: 'user', content: 'Health check' }],
    });

    if (response.choices && response.choices.length > 0) {
      return NextResponse.json({
        status: 'ok',
        message: 'OpenRouter connection successful.',
        modelUsed: 'mistralai/mistral-7b-instruct:free',
      });
    } else {
      throw new Error('Invalid response structure from OpenRouter.');
    }
  } catch (error) {
    logger.error('OpenRouter health check failed', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to connect to OpenRouter.',
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}

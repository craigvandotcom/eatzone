import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { logger } from '@/lib/utils/logger';

export interface AuthenticatedRequest {
  userId: string;
  userEmail: string;
}

export async function requireAuth(): Promise<
  AuthenticatedRequest | NextResponse
> {
  try {
    const cookieStore = await cookies();

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options);
              });
            } catch {}
          },
        },
      }
    );

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      logger.warn('Unauthorized API request', { error: error?.message });
      return NextResponse.json(
        {
          error: {
            message: 'Authentication required',
            code: 'UNAUTHORIZED',
            statusCode: 401,
          },
        },
        { status: 401 }
      );
    }

    return {
      userId: user.id,
      userEmail: user.email || '',
    };
  } catch (error) {
    logger.error('Auth verification error', error);
    return NextResponse.json(
      {
        error: {
          message: 'Authentication verification failed',
          code: 'AUTH_ERROR',
          statusCode: 500,
        },
      },
      { status: 500 }
    );
  }
}

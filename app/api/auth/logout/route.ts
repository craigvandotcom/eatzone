import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { logger } from '@/lib/utils/logger';
import { requireAuth } from '@/lib/auth/api';

export async function POST(_request: NextRequest) {
  const authResult = await requireAuth();
  if (authResult instanceof NextResponse) {
    return authResult;
  }

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

    const { error } = await supabase.auth.signOut();

    if (error) {
      logger.error('Logout error', error);
      return NextResponse.json(
        {
          error: {
            message: 'Failed to logout',
            code: 'LOGOUT_FAILED',
            statusCode: 500,
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        message: 'Logout successful',
      },
      { status: 200 }
    );
  } catch (error) {
    logger.error('Logout error', error);
    return NextResponse.json(
      {
        error: {
          message: 'An error occurred during logout',
          code: 'INTERNAL_SERVER_ERROR',
          statusCode: 500,
        },
      },
      { status: 500 }
    );
  }
}

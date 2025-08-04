import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { logger } from '@/lib/utils/logger';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
            // In development, log for visibility
            if (process.env.NODE_ENV === 'development') {
              logger.debug(
                '[Supabase Server] Cookie operation in Server Component context',
                {
                  error:
                    error instanceof Error ? error.message : 'Unknown error',
                  context:
                    'This is expected when called from Server Components',
                },
              );
            }
          }
        },
      },
    },
  );
}

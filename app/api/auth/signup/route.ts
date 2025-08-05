import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { logger } from '@/lib/utils/logger';

// Rate limiting setup for auth endpoints
let ratelimit: Ratelimit | null = null;

if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
  ratelimit = new Ratelimit({
    redis: new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    }),
    limiter: Ratelimit.slidingWindow(5, '15 m'), // 5 signups per 15 minutes per IP
  });
}

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting check
    if (ratelimit) {
      const forwardedFor = request.headers.get('x-forwarded-for');
      const realIp = request.headers.get('x-real-ip');
      const ip = forwardedFor?.split(',')[0] ?? realIp ?? '127.0.0.1';

      const { success, limit, reset, remaining } = await ratelimit.limit(
        `signup:${ip}`
      );

      if (!success) {
        return NextResponse.json(
          {
            error: {
              message: 'Too many signup attempts. Please try again later.',
              code: 'RATE_LIMIT_EXCEEDED',
              statusCode: 429,
            },
          },
          {
            status: 429,
            headers: {
              'X-RateLimit-Limit': limit.toString(),
              'X-RateLimit-Remaining': remaining.toString(),
              'X-RateLimit-Reset': new Date(reset).toISOString(),
            },
          }
        );
      }
    }

    const body = await request.json();
    const { email, password } = signupSchema.parse(body);

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

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      logger.warn('Signup failed', { error: error.message, email });
      return NextResponse.json(
        {
          error: {
            message: error.message,
            code: 'SIGNUP_FAILED',
            statusCode: 400,
          },
        },
        { status: 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        {
          error: {
            message: 'Failed to create user',
            code: 'USER_CREATION_FAILED',
            statusCode: 500,
          },
        },
        { status: 500 }
      );
    }

    // Create user profile
    const { error: profileError } = await supabase
      .from('users')
      .upsert({
        id: data.user.id,
        email: data.user.email || email,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (profileError) {
      logger.error('Failed to create user profile', profileError);
    }

    return NextResponse.json(
      {
        user: {
          id: data.user.id,
          email: data.user.email,
        },
        message: 'Account created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    logger.error('Signup error', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: {
            message: 'Invalid input data',
            code: 'VALIDATION_ERROR',
            statusCode: 400,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: {
          message: 'An error occurred during signup',
          code: 'INTERNAL_SERVER_ERROR',
          statusCode: 500,
        },
      },
      { status: 500 }
    );
  }
}

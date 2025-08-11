/**
 * Integration tests for API route middleware behavior
 *
 * These tests ensure that:
 * - API routes are accessible without authentication
 * - Protected app routes require authentication
 * - Middleware correctly distinguishes between API and app routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
  },
};

// Mock NextResponse.next
jest.mock('next/server', () => ({
  ...jest.requireActual('next/server'),
  NextResponse: {
    ...jest.requireActual('next/server').NextResponse,
    next: jest.fn(() => {
      const response = new Response(null, { status: 200 });
      return response;
    }),
  },
}));

// Mock the createServerClient function
jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(() => mockSupabaseClient),
}));

describe.skip('API Middleware Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('API Routes', () => {
    it('should allow unauthenticated access to /api/analyze-image', async () => {
      // Mock no authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/analyze-image',
        {
          method: 'POST',
        }
      );

      const response = await updateSession(request);

      // Should NOT redirect
      expect(response.status).not.toBe(307);
      expect(response.headers.get('location')).toBeNull();
    });

    it('should allow unauthenticated access to /api/zone-ingredients', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/zone-ingredients',
        {
          method: 'POST',
        }
      );

      const response = await updateSession(request);

      // Should NOT redirect
      expect(response.status).not.toBe(307);
      expect(response.headers.get('location')).toBeNull();
    });

    it('should allow unauthenticated access to /api/ai-status', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/ai-status', {
        method: 'GET',
      });

      const response = await updateSession(request);

      // Should NOT redirect
      expect(response.status).not.toBe(307);
      expect(response.headers.get('location')).toBeNull();
    });

    it('should allow authenticated access to API routes', async () => {
      // Mock authenticated user
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
          },
        },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/analyze-image',
        {
          method: 'POST',
        }
      );

      const response = await updateSession(request);

      // Should NOT redirect
      expect(response.status).not.toBe(307);
      expect(response.headers.get('location')).toBeNull();
    });
  });

  describe('Protected App Routes', () => {
    it('should redirect unauthenticated users from /app to /login', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/app');

      const response = await updateSession(request);

      // Should redirect to login
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/login');
    });

    it('should redirect unauthenticated users from /app/foods/add to /login', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/app/foods/add');

      const response = await updateSession(request);

      // Should redirect to login
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/login');
    });

    it('should allow authenticated users to access protected routes', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: {
          user: {
            id: 'test-user-id',
            email: 'test@example.com',
          },
        },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/app');

      const response = await updateSession(request);

      // Should NOT redirect
      expect(response.status).not.toBe(307);
      expect(response.headers.get('location')).toBeNull();
    });
  });

  describe('Public Routes', () => {
    const publicRoutes = ['/', '/login', '/signup', '/auth/callback'];

    publicRoutes.forEach(route => {
      it(`should allow unauthenticated access to ${route}`, async () => {
        mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
          data: { user: null },
          error: null,
        });

        const request = new NextRequest(`http://localhost:3000${route}`);

        const response = await updateSession(request);

        // Should NOT redirect
        expect(response.status).not.toBe(307);
        expect(response.headers.get('location')).toBeNull();
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle routes with query parameters correctly', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/analyze-image?debug=true'
      );

      const response = await updateSession(request);

      // API route should not redirect even with query params
      expect(response.status).not.toBe(307);
    });

    it('should handle nested API routes correctly', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/v2/nested/endpoint'
      );

      const response = await updateSession(request);

      // Should not redirect nested API routes
      expect(response.status).not.toBe(307);
    });

    it('should distinguish between /api and /api-like routes', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      // This is NOT an API route (doesn't start with /api/)
      const request = new NextRequest('http://localhost:3000/api-docs');

      const response = await updateSession(request);

      // Should redirect because it's not actually an API route
      expect(response.status).toBe(307);
      expect(response.headers.get('location')).toContain('/login');
    });
  });

  describe('Cookie Handling', () => {
    it('should properly handle Supabase cookies for API routes', async () => {
      const mockCookies = [{ name: 'sb-auth-token', value: 'test-token' }];

      mockSupabaseClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: null,
      });

      const request = new NextRequest(
        'http://localhost:3000/api/analyze-image',
        {
          method: 'POST',
        }
      );

      // Add cookies to request
      mockCookies.forEach(({ name, value }) => {
        request.cookies.set(name, value);
      });

      const response = await updateSession(request);

      // Verify cookies are preserved in response
      expect(response.status).not.toBe(307);

      // Check that createServerClient was called with cookies
      const { createServerClient } = require('@supabase/ssr');
      expect(createServerClient).toHaveBeenCalledWith(
        expect.any(String),
        expect.any(String),
        expect.objectContaining({
          cookies: expect.objectContaining({
            getAll: expect.any(Function),
            setAll: expect.any(Function),
          }),
        })
      );
    });
  });
});

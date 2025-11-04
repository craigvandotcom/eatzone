/**
 * Browser Test Helpers
 * 
 * Utility functions for browser automation testing, especially for authentication
 * workflows that require programmatic login via the test-login API endpoint.
 * 
 * These helpers are designed for use with browser MCP tools or other automation
 * that cannot interact with React controlled form components.
 */

/**
 * Authenticates a user via the test-login API endpoint
 * 
 * This bypasses the UI form and directly authenticates using Supabase.
 * Only works in non-production environments.
 * 
 * @param baseUrl - The base URL of the application (e.g., 'http://localhost:3000')
 * @param email - User email address
 * @param password - User password
 * @returns Promise that resolves with authentication result
 * 
 * @example
 * ```typescript
 * await browserTestLogin('http://localhost:3000', 'test@example.com', 'password123');
 * // Now navigate to /app - user is authenticated
 * ```
 */
export async function browserTestLogin(
  baseUrl: string,
  email: string,
  password: string
): Promise<{ success: boolean; user?: { id: string; email: string }; error?: string }> {
  const response = await fetch(`${baseUrl}/api/auth/test-login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
    credentials: 'include', // Important: Include cookies for session
  });

  const data = await response.json();

  if (!response.ok) {
    console.error('[browserTestLogin] Authentication failed:', data.error);
    return { success: false, error: data.error };
  }

  console.log('[browserTestLogin] Authentication successful:', data.user.email);
  return { success: true, user: data.user };
}

/**
 * Test login workflow for browser automation
 * 
 * Complete workflow:
 * 1. Navigate to test-login endpoint
 * 2. Authenticate user
 * 3. Redirect to app dashboard
 * 
 * @param baseUrl - The base URL of the application
 * @param email - User email address
 * @param password - User password
 * @returns Promise with authentication result
 */
export async function browserAuthWorkflow(
  baseUrl: string,
  email: string,
  password: string
): Promise<{ success: boolean; redirectUrl?: string; error?: string }> {
  try {
    const result = await browserTestLogin(baseUrl, email, password);

    if (!result.success) {
      return { success: false, error: result.error };
    }

    // After successful authentication, user can navigate to /app
    const redirectUrl = `${baseUrl}/app`;
    console.log('[browserAuthWorkflow] Ready to navigate to:', redirectUrl);

    return { success: true, redirectUrl };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('[browserAuthWorkflow] Error:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Environment variable helpers for test credentials
 */
export function getTestCredentials(): { email: string; password: string } | null {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;

  if (!email || !password) {
    console.warn(
      '[getTestCredentials] TEST_USER_EMAIL or TEST_USER_PASSWORD not set in environment'
    );
    return null;
  }

  return { email, password };
}

/**
 * Quick test login using environment variables
 * 
 * Convenience function that reads credentials from environment and authenticates.
 * 
 * @param baseUrl - The base URL of the application
 * @returns Promise with authentication result
 * 
 * @example
 * ```typescript
 * // Assumes TEST_USER_EMAIL and TEST_USER_PASSWORD are set in .env.local
 * await quickTestLogin('http://localhost:3000');
 * ```
 */
export async function quickTestLogin(
  baseUrl: string
): Promise<{ success: boolean; redirectUrl?: string; error?: string }> {
  const credentials = getTestCredentials();

  if (!credentials) {
    return {
      success: false,
      error: 'Test credentials not found in environment variables',
    };
  }

  return browserAuthWorkflow(baseUrl, credentials.email, credentials.password);
}

/**
 * Usage examples for browser MCP tools:
 * 
 * // Option 1: Navigate to API endpoint directly (simpler)
 * await page.goto('http://localhost:3000/api/auth/test-login', {
 *   method: 'POST',
 *   body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
 * });
 * await page.goto('http://localhost:3000/app'); // Now authenticated
 * 
 * // Option 2: Use helper in Node.js script
 * import { browserTestLogin } from './browser-test-helpers';
 * await browserTestLogin('http://localhost:3000', email, password);
 * // Then navigate with browser tools to /app
 * 
 * // Option 3: Quick login with env vars
 * import { quickTestLogin } from './browser-test-helpers';
 * const result = await quickTestLogin('http://localhost:3000');
 * if (result.success) {
 *   // Navigate to result.redirectUrl
 * }
 */


import { isDemoMode, quickDemoLogin, getEnvironmentType } from '@/lib/db';
import { getCurrentUser } from '@/lib/db';
import { User } from '@/lib/types';
import { logger } from '@/lib/utils/logger';

interface DemoLoginResult {
  success: boolean;
  user?: User;
  error?: Error;
}

/**
 * Handles demo mode login with automatic retry logic
 * @returns DemoLoginResult with success status and user if successful
 */
export async function handleDemoModeLogin(): Promise<DemoLoginResult> {
  if (!isDemoMode()) {
    return { 
      success: false, 
      error: new Error('Demo mode is not enabled') 
    };
  }

  const envType = getEnvironmentType();
  logger.demo(
    `${envType.charAt(0).toUpperCase() + envType.slice(1)} mode: Auto-logging in with demo user`
  );

  try {
    const demoLogin = await quickDemoLogin();
    if (!demoLogin) {
      return { 
        success: false, 
        error: new Error('Demo login failed') 
      };
    }

    // The user is already authenticated through Supabase by quickDemoLogin
    const profile = await getCurrentUser();
    if (!profile) {
      return { 
        success: false, 
        error: new Error('Failed to get user profile after demo login') 
      };
    }

    return { success: true, user: profile };
  } catch (error) {
    logger.error('Demo login failed', error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Unknown error during demo login') 
    };
  }
}

/**
 * Attempts demo login with retry logic for error scenarios
 * @returns DemoLoginResult with success status and user if successful
 */
export async function attemptDemoLoginWithRetry(): Promise<DemoLoginResult> {
  const envType = getEnvironmentType();
  logger.demo(
    `${envType.charAt(0).toUpperCase() + envType.slice(1)} mode: Session error, auto-logging in with demo user`
  );

  try {
    const result = await handleDemoModeLogin();
    return result;
  } catch (error) {
    logger.error('Demo login retry failed', error);
    return { 
      success: false, 
      error: error instanceof Error ? error : new Error('Demo login retry failed') 
    };
  }
}

/**
 * Gets demo user credentials based on environment
 * @returns Object with email and password for demo user
 */
export function getDemoUserCredentials() {
  const envType = getEnvironmentType();
  
  if (envType === 'development') {
    return {
      email: 'dev@test.com',
      password: 'password',
      name: 'Dev User'
    };
  }
  
  // For preview/production, return first demo account
  return {
    email: 'demo@puls.app',
    password: 'demo123',
    name: 'Demo User'
  };
}
import { FullConfig } from '@playwright/test';

/**
 * Global teardown for Playwright tests
 * Runs once after all tests complete
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown...');
  
  // Clean up any test data if needed
  // For now, just log completion
  
  console.log('✅ Global teardown completed');
}

export default globalTeardown;
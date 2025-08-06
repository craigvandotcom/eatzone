import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup for Playwright tests
 * Runs once before all tests
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup...');

  // Verify server is running
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    await page.goto('http://localhost:3000', { timeout: 30000 });
    console.log('✅ Server is running and responsive');
  } catch (error) {
    console.error('❌ Server is not running or not responsive');
    console.error('Make sure to run: pnpm build && pnpm start');
    throw error;
  } finally {
    await browser.close();
  }

  console.log('✅ Global setup completed');
}

export default globalSetup;

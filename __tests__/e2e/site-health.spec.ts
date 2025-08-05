import { test, expect } from '@playwright/test';

/**
 * Site Health Check - Automated E2E Tests
 *
 * Critical tests for basic app functionality:
 * - App loads without errors
 * - Navigation works correctly
 * - No critical console errors
 * - Responsive design works
 */

test.describe('Site Health', () => {
  test.beforeEach(async ({ page }) => {
    // Monitor console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        // Filter out known non-critical errors
        const text = msg.text();
        if (!text.includes('Manifest') && !text.includes('deprecated')) {
          consoleErrors.push(text);
        }
      }
    });

    // Store errors for assertions
    (page as any).consoleErrors = consoleErrors;
  });

  test('home page loads correctly', async ({ page }) => {
    await page.goto('/');

    // Check main heading is visible - use first() to handle multiple matches
    await expect(
      page.getByRole('heading', { name: /your body.*compass/i }).first()
    ).toBeVisible();

    // Check key navigation elements - use first() to handle multiple matches
    await expect(
      page.getByRole('link', { name: /log in/i }).first()
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /get started/i }).first()
    ).toBeVisible();

    // Check main CTA is present (could be "Start Tracking" or "Get Started")
    const ctaVisible = await page
      .getByRole('link', { name: /start tracking|get started/i })
      .first()
      .isVisible();
    expect(ctaVisible).toBe(true);

    // Verify no critical console errors
    const consoleErrors = (page as any).consoleErrors || [];
    expect(consoleErrors).toHaveLength(0);
  });

  test('navigation between auth pages works', async ({ page }) => {
    await page.goto('/');

    // Navigate to login page
    await page
      .getByRole('link', { name: /log in/i })
      .first()
      .click();
    await expect(page).toHaveURL('/login');
    await expect(
      page.getByRole('heading', { name: /body compass/i })
    ).toBeVisible();
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();

    // Navigate to signup page
    await page.getByRole('link', { name: /sign up/i }).click();
    await expect(page).toHaveURL('/signup');
    await expect(page.getByText(/create your account/i)).toBeVisible();

    // Navigate back to home
    await page.getByRole('link', { name: /back to home/i }).click();
    await expect(page).toHaveURL('/');
    await expect(
      page.getByRole('heading', { name: /your body.*compass/i }).first()
    ).toBeVisible();
  });

  test('login page has proper form elements', async ({ page }) => {
    await page.goto('/login');

    // Check form elements exist
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
    await expect(
      page.getByRole('textbox', { name: /password/i })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();

    // Check navigation links
    await expect(page.getByRole('link', { name: /sign up/i })).toBeVisible();
    await expect(
      page.getByRole('link', { name: /back to home/i })
    ).toBeVisible();

    // Verify no critical console errors
    const consoleErrors = (page as any).consoleErrors || [];
    expect(consoleErrors).toHaveLength(0);
  });

  test('signup page has proper form elements', async ({ page }) => {
    await page.goto('/signup');

    // Check form elements exist
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
    await expect(
      page.getByRole('textbox', { name: /^password$/i })
    ).toBeVisible();
    await expect(
      page.getByRole('textbox', { name: /confirm password/i })
    ).toBeVisible();
    await expect(page.getByRole('checkbox')).toBeVisible();

    // Check create account button (initially disabled)
    const createButton = page.getByRole('button', { name: /create account/i });
    await expect(createButton).toBeVisible();
    await expect(createButton).toBeDisabled();

    // Check navigation links
    await expect(
      page.getByRole('link', { name: /sign in here/i })
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: /back to home/i })
    ).toBeVisible();

    // Verify privacy messaging
    await expect(page.getByText(/100% private & local/i)).toBeVisible();
    await expect(page.getByText(/why your privacy matters/i)).toBeVisible();
  });

  test('responsive design works on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');

    // Check main elements are still visible on mobile
    await expect(
      page.getByRole('heading', { name: /your body.*compass/i }).first()
    ).toBeVisible();
    const mobileCta = await page
      .getByRole('link', { name: /start tracking|get started/i })
      .first()
      .isVisible();
    expect(mobileCta).toBe(true);

    // Test mobile navigation - use first() to handle multiple matches
    await page
      .getByRole('link', { name: /get started/i })
      .first()
      .click();
    await expect(page).toHaveURL('/signup');

    // Check signup form is mobile-friendly
    await expect(page.getByRole('textbox', { name: /email/i })).toBeVisible();
    await expect(
      page.getByRole('textbox', { name: /^password$/i })
    ).toBeVisible();
  });

  test('protected routes redirect to login', async ({ page }) => {
    // Try to access protected app route
    await page.goto('/app');

    // Should redirect to login
    await expect(page).toHaveURL('/login');
    await expect(
      page.getByRole('heading', { name: /body compass/i })
    ).toBeVisible();
  });

  test('PWA features are available', async ({ page }) => {
    await page.goto('/');

    // Check for PWA manifest
    const manifestLink = await page.locator('link[rel="manifest"]').count();
    expect(manifestLink).toBeGreaterThan(0);

    // Check for service worker registration capability
    const hasServiceWorker = await page.evaluate(() => {
      return 'serviceWorker' in navigator;
    });
    expect(hasServiceWorker).toBe(true);
  });

  test('key marketing content is present', async ({ page }) => {
    await page.goto('/');

    // Check key value propositions
    await expect(page.getByText(/private.*offline.*ai-powered/i)).toBeVisible();
    await expect(page.getByText(/your data stays with you/i)).toBeVisible();
    await expect(page.getByText(/ai-powered capture/i)).toBeVisible();
    await expect(page.getByText(/privacy by design/i)).toBeVisible();

    // Check feature highlights - use first() to handle multiple matches
    await expect(page.getByText(/foods/i).first()).toBeVisible();
    await expect(page.getByText(/symptoms/i).first()).toBeVisible();
    await expect(page.getByText(/ingredient analysis/i)).toBeVisible();
  });
});

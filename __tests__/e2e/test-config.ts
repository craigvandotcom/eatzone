/**
 * E2E Test Configuration
 * Contains test data and settings for Playwright MCP tests
 */

export const TEST_CONFIG = {
  // Base URL for testing (production build)
  baseUrl: 'http://localhost:3000',

  // Test email addresses (REAL emails required for Supabase auth)
  // Note: These should be real, accessible email addresses for testing
  testEmails: {
    primary: 'puls.test.primary@gmail.com', // Replace with real test email
    secondary: 'puls.test.secondary@gmail.com', // Replace with real test email
    cleanup: 'puls.test.cleanup@gmail.com', // Replace with real test email
  },

  // Test passwords
  testPassword: 'TestPassword123!',

  // Test timeouts
  timeouts: {
    pageLoad: 5000,
    elementWait: 3000,
    authFlow: 10000,
    aiAnalysis: 15000,
  },

  // Test data
  testData: {
    food: {
      name: 'Test Healthy Salad',
      ingredients: 'spinach, tomatoes, olive oil',
    },
    symptom: {
      name: 'Test Headache',
      severity: 'Moderate',
      notes: 'After lunch test symptom',
    },
  },

  // Expected elements for validation
  selectors: {
    navigation: {
      homeLink: 'nav [href="/"]',
      appLink: 'nav [href="/app"]',
      settingsLink: 'nav [href="/settings"]',
    },
    auth: {
      emailInput: 'input[type="email"]',
      passwordInput: 'input[type="password"]',
      signUpButton: 'button[type="submit"]:has-text("Sign Up")',
      signInButton: 'button[type="submit"]:has-text("Sign In")',
      signOutButton: 'button:has-text("Sign Out")',
    },
    dashboard: {
      bodyCompassHeading: 'h1:has-text("Body Compass")',
      foodsTab: 'button:has-text("Foods")',
      symptomsTab: 'button:has-text("Symptoms")',
      addFoodButton: '[aria-label*="food"]',
      addSymptomButton: '[aria-label*="symptom"]',
    },
  },
};

/**
 * Helper function to generate unique test email
 * Uses timestamp to ensure uniqueness across test runs
 */
export function generateTestEmail(prefix: string = 'test'): string {
  const timestamp = Date.now();
  return `puls.${prefix}.${timestamp}@gmail.com`;
}

/**
 * Test utilities for common operations
 */
export const testUtils = {
  /**
   * Wait for network requests to complete
   */
  waitForNetworkIdle: () => new Promise(resolve => setTimeout(resolve, 1000)),

  /**
   * Generate test user data
   */
  generateTestUser: () => ({
    email: generateTestEmail(),
    password: TEST_CONFIG.testPassword,
    name: `Test User ${Date.now()}`,
  }),

  /**
   * Common validation texts
   */
  validationTexts: {
    signUpSuccess: /welcome|account created|sign up successful/i,
    signInSuccess: /dashboard|body compass|welcome back/i,
    signOutSuccess: /signed out|goodbye|login/i,
    foodSaved: /food saved|added successfully|saved to diary/i,
    symptomSaved: /symptom saved|added successfully|recorded/i,
  },
};

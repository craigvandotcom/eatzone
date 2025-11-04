# Browser Automation Testing Guide

## Overview

This guide explains how to perform browser automation testing with authenticated sessions, especially useful for testing UI features like the sticky header, dashboard interactions, and other protected routes.

## The Challenge

Browser automation tools (like browser MCP) cannot easily interact with React controlled form components due to:
- React's synthetic event system
- Controlled component state management
- Client-side rendering with Suspense
- Accessibility tree limitations

## Solution: Test Login API Endpoint

We've implemented a test-only authentication endpoint that bypasses the UI form and directly authenticates users via Supabase.

---

## Test Login API Endpoint

### **Endpoint:** `/api/auth/test-login`

**Method:** POST  
**Content-Type:** application/json  
**Availability:** Development and test environments only (blocked in production)

### Request Body

```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

### Responses

**Success (200):**
```json
{
  "success": true,
  "user": {
    "id": "user-uuid",
    "email": "user@example.com",
    "created_at": "2025-01-01T00:00:00Z"
  }
}
```

**Invalid Credentials (401):**
```json
{
  "error": "Invalid login credentials"
}
```

**Missing Fields (400):**
```json
{
  "error": "Email and password are required"
}
```

**Invalid Email Format (400):**
```json
{
  "error": "Invalid email format"
}
```

**Production Environment (403):**
```json
{
  "error": "This endpoint is not available in production"
}
```

### Security

- ✅ Only available when `NODE_ENV !== 'production'`
- ✅ Uses real Supabase authentication (not a backdoor)
- ✅ Validates email format
- ✅ Returns appropriate HTTP status codes
- ✅ Sets authentication cookies for subsequent requests

---

## Usage Methods

### Method 1: Direct API Call with curl

```bash
# Test authentication
curl -X POST http://localhost:3000/api/auth/test-login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}' \
  -c cookies.txt

# Navigate to app with authenticated session
curl http://localhost:3000/app -b cookies.txt
```

### Method 2: Browser MCP Tools

```javascript
// 1. Start dev server
// pnpm dev

// 2. Use fetch to authenticate (gets session cookie)
await fetch('http://localhost:3000/api/auth/test-login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'password123'
  }),
  credentials: 'include'  // Important: includes cookies
});

// 3. Navigate to protected route with browser tools
// Session cookie is automatically included
await browser_navigate({ url: 'http://localhost:3000/app' });

// 4. Now you can test UI features
await browser_snapshot();
await browser_take_screenshot({ filename: 'dashboard.png' });
```

### Method 3: Node.js Helper Functions

```typescript
// Import helper
import { browserTestLogin } from '@/scripts/browser-test-helpers';

// Authenticate
const result = await browserTestLogin(
  'http://localhost:3000',
  'test@example.com',
  'password123'
);

if (result.success) {
  console.log('Authenticated:', result.user.email);
  // Navigate to /app - already authenticated
}

// Or use quick login with environment variables
import { quickTestLogin } from '@/scripts/browser-test-helpers';

const result = await quickTestLogin('http://localhost:3000');
if (result.success) {
  // Navigate to result.redirectUrl
}
```

### Method 4: Playwright E2E Tests (Recommended for Full Testing)

```typescript
// __tests__/e2e/test-helpers.ts
import { Page } from '@playwright/test';

export async function login(page: Page) {
  await page.goto('http://localhost:3000/login');
  
  await page.getByTestId('login-email').fill(process.env.TEST_USER_EMAIL!);
  await page.getByTestId('login-password').fill(process.env.TEST_USER_PASSWORD!);
  await page.getByTestId('login-submit').click();
  
  await page.waitForURL('**/app');
}

// Usage in tests
test('sticky header behavior', async ({ page }) => {
  await login(page);
  
  // Test sticky header
  await page.evaluate(() => window.scrollBy(0, 500));
  const header = page.locator('[data-testid="full-width-header"]');
  await expect(header).toBeVisible();
});
```

---

## Testing Workflow

### For Visual/UI Testing (Browser MCP)

1. **Start development server:**
   ```bash
   pnpm dev
   ```

2. **Authenticate via API:**
   ```bash
   curl -X POST http://localhost:3000/api/auth/test-login \
     -H "Content-Type: application/json" \
     -d '{"email":"YOUR_EMAIL","password":"YOUR_PASSWORD"}' \
     -c cookies.txt
   ```

3. **Use browser tools with authenticated session:**
   - Navigate to protected routes
   - Take screenshots
   - Test UI interactions
   - Verify responsive design

### For Comprehensive E2E Testing (Playwright)

1. **Set up test credentials in `.env.local`:**
   ```env
   TEST_USER_EMAIL=test@example.com
   TEST_USER_PASSWORD=your-password
   ```

2. **Run E2E tests:**
   ```bash
   pnpm test:e2e           # Run all E2E tests
   pnpm test:e2e:ui        # Run with UI
   pnpm test:e2e:debug     # Run with debugger
   ```

---

## Test User Credentials

Test credentials are stored in `.env.local` (gitignored):

```env
TEST_USER_EMAIL=your-test-email@example.com
TEST_USER_PASSWORD=your-test-password
```

These credentials are used by:
- Playwright E2E tests
- Browser automation scripts
- Development testing workflows

**Security Note:** Never commit real credentials to version control.

---

## data-testid Attributes

The login form now includes `data-testid` attributes for better Playwright testing:

```tsx
<Input data-testid="login-email" />
<Input data-testid="login-password" />
<button data-testid="login-toggle-password" />
<Button data-testid="login-submit" />
```

### Benefits:

- ✅ More resilient to UI changes
- ✅ Self-documenting test touchpoints
- ✅ Standard React Testing Library practice
- ✅ Easier to maintain tests

**Note:** These are **not** visible to browser MCP tools (which only see the accessibility tree), but are essential for Playwright tests.

---

## When to Use Each Method

| Use Case | Recommended Method | Why |
|----------|-------------------|-----|
| **Quick visual checks** | Browser MCP + Test API | Fast, no form interaction needed |
| **Screenshot testing** | Browser MCP + Test API | Direct authentication, then navigate |
| **Comprehensive UX testing** | Playwright E2E | Full DOM access, proper form interaction |
| **Login flow testing** | Playwright E2E | Tests actual user authentication experience |
| **CI/CD testing** | Playwright E2E | Automated, reliable, complete coverage |
| **Manual debugging** | Browser MCP + Test API | Quick iteration on UI features |

---

## Example: Testing Sticky Header

### Using Browser MCP + Test API

```bash
# 1. Start dev server
pnpm dev

# 2. Authenticate
curl -X POST http://localhost:3000/api/auth/test-login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"pass123"}' \
  -c /tmp/cookies.txt

# 3. Use browser tools
# Navigate to http://localhost:3000/app (with cookies)
# Take snapshot, scroll down, take another snapshot
# Verify header remains visible
```

### Using Playwright

```typescript
test('sticky header stays visible when scrolling', async ({ page }) => {
  // Login
  await login(page);
  
  // Get initial header position
  const header = page.locator('[data-testid="full-width-header"]');
  await expect(header).toBeVisible();
  
  const initialBounds = await header.boundingBox();
  
  // Scroll down
  await page.evaluate(() => window.scrollBy(0, 1000));
  
  // Header should still be visible at top
  await expect(header).toBeVisible();
  
  const scrolledBounds = await header.boundingBox();
  expect(scrolledBounds?.y).toBe(0); // Should be stuck at top
  
  // Take screenshot for visual verification
  await page.screenshot({ path: 'sticky-header-scrolled.png' });
});
```

---

## Troubleshooting

### "This endpoint is not available in production"

**Cause:** Running `pnpm start` (production build)  
**Solution:** Use `pnpm dev` for development testing

### "Email and password are required"

**Cause:** Missing or malformed request body  
**Solution:** Ensure JSON body includes both `email` and `password` fields

### "Invalid email format"

**Cause:** Email doesn't match regex pattern  
**Solution:** Use valid email format (user@domain.com)

### "Invalid login credentials"

**Cause:** Incorrect email/password or user doesn't exist  
**Solution:** Verify credentials match a real user in your Supabase database

### Browser session not persisting

**Cause:** Cookies not being sent with subsequent requests  
**Solution:** Use `credentials: 'include'` in fetch or `-c/-b` with curl

---

## Files Reference

| File | Purpose |
|------|---------|
| `app/api/auth/test-login/route.ts` | Test login API endpoint |
| `scripts/browser-test-helpers.ts` | Helper functions for authentication |
| `app/(auth)/login/login-form-client.tsx` | Login form with data-testid attributes |
| `__tests__/e2e/test-helpers.ts` | Playwright test helpers |
| `.env.local` | Test credentials (gitignored) |

---

## Best Practices

1. ✅ **Use test API for visual testing only** - It bypasses form validation
2. ✅ **Use Playwright for comprehensive testing** - Tests real user flows
3. ✅ **Never commit test credentials** - Keep .env.local gitignored
4. ✅ **Always test in development mode** - Test API is blocked in production
5. ✅ **Use data-testid for Playwright** - Makes tests more resilient
6. ✅ **Verify session cookies are included** - Required for authenticated requests

---

## Summary

The test login API endpoint provides a pragmatic solution for browser automation testing when direct form interaction is not possible. It complements (not replaces) comprehensive Playwright E2E testing, offering a fast path for visual verification and UI debugging workflows.

**Remember:** This is a development tool. It's intentionally blocked in production to maintain security.


# Testing Practices

This document combines testing best practices with project-specific improvements and patterns for eatZone.

## Overview

eatZone uses a **dual testing approach** combining Jest for fast feedback and Playwright for comprehensive E2E validation. This follows the testing trophy pattern for optimal speed and confidence.

## Testing Architecture

### **Jest Tests** (Fast, Many)

- **Unit tests**: Pure functions, utilities, business logic
- **Component tests**: React components in isolation with Testing Library
- **Integration tests**: Feature slices with mocked dependencies
- **Speed**: <5 seconds for full suite
- **Purpose**: Fast development feedback loop

### **Playwright Tests** (Slow, Few)

- **E2E tests**: Critical user journeys in real browser
- **Auth flows**: Real Supabase authentication with actual emails
- **PWA validation**: Installation, offline mode, responsive design
- **Speed**: ~30 seconds for full suite
- **Purpose**: Production-ready confidence

## Test Commands

### Development Workflow

```bash
pnpm test:watch          # Jest only - continuous feedback
pnpm test               # Jest only - pre-commit validation
pnpm type-check         # TypeScript validation
```

### Comprehensive Validation

```bash
pnpm test:e2e           # Playwright only - critical journeys
pnpm test:all           # Both Jest + Playwright
pnpm build:check        # Build + lint + type check
```

### Debugging

```bash
pnpm test:e2e:ui        # Visual Playwright interface
pnpm test:e2e:debug     # Step-through debugging
pnpm test:e2e:headed    # Run in visible browser
```

## Current Test Coverage

### **E2E Tests** (Playwright)

✅ **Site Health** (8 tests) - Basic functionality, navigation, responsive design  
✅ **Auth Flow** (6 tests) - Login, session persistence, protected routes (with skip logic)  
🔄 **Food Journey** - Camera → AI analysis → save → dashboard  
🔄 **Symptom Journey** - Add symptom → save → view

### **Integration/Component Tests** (Jest)

✅ **Dashboard Integration** - Loading states, data display, navigation  
✅ **Auth Flow Integration** - Mocked auth scenarios  
✅ **Login Form Component** - Form validation and submission  
✅ **Food Entry Form** - Component behavior

### **Unit Tests** (Jest)

✅ **Hooks Tests** - Custom hook logic  
✅ **Data Operations** - Database operations  
🔄 **Ingredient Zoning** - Business logic for food classification  
🔄 **Data Transformations** - Utilities and calculations

## Testing Principles

### Do Test

- ✅ User behavior and workflows
- ✅ Critical business logic
- ✅ Error handling and edge cases
- ✅ Accessibility and responsive design
- ✅ Real authentication flows
- ✅ Data persistence and sync

### Don't Test

- ❌ Implementation details
- ❌ Third-party library internals
- ❌ Styling/CSS (unless functional)
- ❌ Mock configurations

## Auth Testing Notes

**Real Email Required**: Auth tests use environment variables for login validation.

**Configuration**:

1. Set `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` in `.env.local`
2. Tests automatically skip if credentials not configured
3. Signup tests are placeholders for future implementation

## Best Practices

### Jest Tests

- Use Testing Library queries (`getByRole`, `getByLabelText`)
- Mock external dependencies (APIs, browser APIs)
- Test behavior, not implementation
- Keep tests fast and focused

### Playwright Tests

- Test complete user journeys
- Use real services where possible
- Validate critical functionality only
- Include accessibility checks

### Pre-Commit Checklist

```bash
pnpm format && pnpm lint && pnpm test && pnpm build:check
```

## Project-Specific Improvements

### 🔒 Security Improvements

**Issue**: Hardcoded test credentials in `auth-flow.spec.ts`

- **Problem**: Email and password were hardcoded
- **Solution**:
  - Added `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` environment variables to `.env.example`
  - Updated `auth-flow.spec.ts` to use environment variables with proper fallback/skip logic
  - Tests now skip gracefully when credentials are not configured

### 🐛 Reliability Improvements

**Issue**: Unreliable `waitForTimeout` usage

- **Problem**: Using arbitrary timeouts can cause flaky tests
- **Solution**: Replaced with Playwright's native wait methods:
  - `page.waitForTimeout(2000)` → `page.waitForLoadState('networkidle')`
  - `page.waitForTimeout(3000)` → `page.waitForLoadState('networkidle')`
  - `page.waitForTimeout(1000)` → `page.waitForLoadState('networkidle')`
  - `page.waitForTimeout(500)` → `page.waitForLoadState('networkidle')`

**Files Updated**:

- `auth-flow.spec.ts`: Fixed 2 instances
- `food-journey.spec.ts`: Fixed 1 instance
- `symptom-journey.spec.ts`: Fixed 2 instances

### 📝 Type Safety Improvements

**Issue**: Extensive use of `any` types throughout test files

- **Problem**: 12 instances of `(page as any)` and 17 instances of `: any` parameters
- **Solution**:
  - Created comprehensive TypeScript interfaces in `__tests__/types/test-types.ts`:
    - `ExtendedPage` interface for Playwright page objects
    - `SupabaseError`, `AuthError`, `CameraError`, `APIError` interfaces
    - `TestCredentials`, `ZonedIngredient`, `AIAnalysisResponse` interfaces
    - Function type definitions for error handlers, loggers, sanitizers

**Files Updated**:

- Created: `__tests__/types/test-types.ts` (new comprehensive type definitions)
- `auth-flow.spec.ts`: Replaced `(page as any)` with `(page as ExtendedPage)`
- `food-journey.spec.ts`: Replaced `(page as any)` with `(page as ExtendedPage)`
- `symptom-journey.spec.ts`: Replaced `(page as any)` with `(page as ExtendedPage)`
- `site-health.spec.ts`: Replaced `(page as any)` with `(page as ExtendedPage)`
- `error-handling.test.ts`: Fixed 14 instances of `: any` with proper interfaces
- `data-transforms.test.ts`: Fixed 1 instance with `ImportDataValidation` interface
- `ai-analysis.test.ts`: Fixed 1 instance with `ZonedIngredient` interface

### ✅ Verification

All improvements verified with:

- **TypeScript Check**: `pnpm type-check` - ✅ No errors
- **ESLint Check**: `pnpm lint` - ✅ No warnings or errors
- **Jest Tests**: Sample unit test - ✅ 28/28 tests passing
- **Playwright Tests**: Sample E2E test - ✅ 8/8 tests passing

### 🚀 Benefits

1. **Security**: No more hardcoded credentials in source control
2. **Reliability**: Tests are more stable with deterministic waits
3. **Type Safety**: Full TypeScript compliance with proper interfaces
4. **Maintainability**: Better error messages and IDE support
5. **Scalability**: Reusable type definitions for future tests

### 🔧 Environment Setup

To use the improved tests:

1. Copy `.env.example` to `.env.local`
2. Set `TEST_USER_EMAIL` and `TEST_USER_PASSWORD` for E2E auth tests
3. All other tests work without additional configuration

The test suite now follows TypeScript strict mode and modern testing best practices.

## General Testing Best Practices

### The Mindset

- **Your job isn't to write tests. Your job is to ship confidence.**
- **Small surface, high signal.** Test what matters to users and contracts between components, not private implementation details.
- **Prefer behavior over wiring.** If a refactor breaks tests but the app still works, your tests were coupled to internals.
- **Types + tests + tooling** all work together: TypeScript prevents whole classes of bugs _before_ runtime, tests prove behavior _at_ runtime, and tools enforce discipline _all the time_.

### What to Test

Think of three layers you'll use daily, plus a few specialty layers:

1. **Unit tests** – fastest feedback. Pure functions, custom hooks logic, small utilities.
2. **Component tests** – render a component and interact with it the way a user would.
3. **Integration and E2E tests** – multiple pieces working together, often with the browser.
4. **Contract tests** – front-end and back-end agree on the shape and semantics of data.
5. **Non-functional tests** – accessibility, visual, performance, and security checks.
6. **Type tests** – compile-time assertions that your generics and overloads behave.

As you grow, you'll aim for a **"testing trophy"** shape: most value from component and integration tests, with a support layer of a few high-value E2E tests and a healthy base of units.

### Your Toolbelt

- **Runner:** Vitest or Jest. If you're on Vite, pick **Vitest**; otherwise **Jest** is fine.
- **DOM testing:** **@testing-library/react** plus **@testing-library/user-event**.
- **E2E and component-in-browser:** **Playwright** (or Cypress if your team already uses it).
- **Mocking network:** **MSW – Mock Service Worker**. Clean, realistic API tests without brittle stubs.
- **Type assertions:** `expectTypeOf` from Vitest or `tsd`, plus `// @ts-expect-error` where appropriate.
- **Coverage & quality:** Istanbul (built into Vitest/Jest), **Stryker** for mutation testing.
- **Accessibility:** **jest-axe** for unit/component; **axe-core** with Playwright for E2E.
- **Visual regression:** Playwright screenshots, or Chromatic if you use Storybook.
- **Contracts:** Pact for consumer–provider contracts, or **zod**/**OpenAPI** schemas shared by both sides.

### Design for Testability

- **Separate "logic" from "IO."** Put data shaping, calculations, and decision logic in plain functions or custom hooks. Keep network and DOM effects at the edges.
- **Dependency injection by parameter, not by reach.** Pass collaborators in (like a fetcher) instead of importing a global.
- **Make side effects swappable.** Wrap `fetch` or storage in tiny adapter modules.
- **Prefer composition to inheritance.** Smaller pieces compose into testable wholes.
- **Deterministic time and randomness.** Centralize `Date.now()`, timers, and random numbers so tests can fix them.
- **Stable selectors.** In UI, query by **accessible role, name, and label**—not by class names.

### Unit Testing

**What belongs here:** pure functions, data mappers, small utilities, reducers, and the logic inside custom hooks.

**Golden pattern:** Arrange–Act–Assert.

```ts
// vitest + typescript example
import { expect, test } from 'vitest';
import { net } from './pricing';

test('net() applies tax and discount', () => {
  const price = net({ base: 100, taxRate: 0.2, discount: 0.1 });
  expect(price).toBe(108); // 100 * 1.2 * 0.9
});
```

**Async tip:** prefer `await` over callbacks; fake timers only when time is the feature you're testing.

### Component Tests

**Principle:** If a user can't do it, your test shouldn't either. Use roles, labels, and text—never `.querySelector(".some-class")`.

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LoginForm } from './LoginForm';

test('submits email and password', async () => {
  render(<LoginForm />);
  await userEvent.type(
    screen.getByRole('textbox', { name: /email/i }),
    'a@b.com'
  );
  await userEvent.type(screen.getByLabelText(/password/i), 'secret');
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }));
  expect(await screen.findByText(/welcome/i)).toBeInTheDocument();
});
```

**Common async tips:**

- Use `findBy...` for things that appear after async work.
- Wrap "event then UI change" expectations in `await screen.findBy...` or `await waitFor(...)`.
- Prefer **MSW** to mock HTTP so your component code doesn't need stubs.

**Custom hooks:** test with `renderHook` from Testing Library's hooks utilities; treat them like small components.

### Integration and E2E

**Integration tests** run components together with real routing, data fetching mocked at the network boundary via MSW. Cheap and powerful.

**E2E tests** run the whole app in a browser. Keep these **few and focused**: sign-in, critical flows, and "does the app boot."

**Make E2E stable:**

- Add **data via API** or seed the DB before the test; don't click through ten screens to set up state.
- Use **test IDs sparingly**—prefer roles. Use IDs only when there's no accessible hook.

### Red Flags and Quick Fixes

- **Tests that change every refactor** → You're asserting implementation details. Move up a level and assert visible behavior.
- **Sleeps and timeouts** → Replace with `findBy...` or `waitFor`.
- **Flaky E2E** → Seed state via API, wait for _conditions_ not _time_, and use robust role-based selectors.
- **Giant fixtures** → Build data with small factory functions so each test states only what's relevant.
- **Slow suite** → Profile tests, run in parallel, turn off React Query retries in tests, and cache browsers.

## Patterns Specific to React and TypeScript

- **Data fetching libraries:**
  - React Query: in tests, provide a **test QueryClient** with retries disabled; wrap your render with a provider.
  - SWR: set up a provider in tests and mock fetch with MSW.

- **State managers:**
  - Redux Toolkit: test reducers with plain unit tests; test slices via component interactions.
  - Zustand/Jotai: export store creators so tests can create isolated stores.

- **Routing:**
  - For React Router, use `MemoryRouter` with initial entries; assert on **screen** not history internals.
  - For Next.js app router, prefer integration tests that hit real routes in Playwright.

- **Types as guardrails:**
  - Turn on strictest TypeScript options (`strict`, `noUncheckedIndexedAccess`, etc.).
  - Use `zod` or similar to validate inbound data at runtime, then `.infer` types to keep compile-time in sync.

## Day-to-Day Workflow

1. **Start with a failing test** for the behavior you want—unit or component, whichever is closer to the user story.
2. **Make it pass with the dumbest change**.
3. **Refactor** mercilessly; your tests guard you.
4. When a story touches I/O or routing, add **one integration test** through the slice.
5. For a new critical journey, add **one E2E**.
6. Before merging: run a11y checks, glance at coverage, and read the diff of any snapshots.

## Rules You Can Say Out Loud

- "**If a user can't do it, my test won't do it.**"
- "**Mock the network, not my components.**"
- "**One integration test per feature slice.**"
- "**Few but mighty E2E tests.**"
- "**Types are tests I don't have to run.**"
- "**Arrange, Act, Assert—and keep them obvious.**"

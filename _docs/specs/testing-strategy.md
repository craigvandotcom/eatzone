# Testing Strategy - Puls App

## Overview

Puls uses a **dual testing approach** combining Jest for fast feedback and Playwright for comprehensive E2E validation. This follows the testing trophy pattern for optimal speed and confidence.

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

This ensures code quality before every commit while maintaining fast feedback loops during development.

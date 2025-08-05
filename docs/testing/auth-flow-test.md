# Auth Flow Testing Guide

This guide covers manual testing of the authentication flow after Phase 1 improvements.

## What Was Fixed

### 1. Auth Loop Prevention
- Added retry logic (3 attempts with exponential backoff) when profile creation fails
- Fallback profile creation if webhook fails
- Prevents infinite sign-out loops

### 2. Webhook Security
- Added request method validation (POST only)
- Optional webhook secret validation
- Content-type validation
- Payload structure validation
- Event type filtering (INSERT on auth.users only)
- Idempotency checks

## Manual Testing Steps

### Prerequisites
1. Ensure local environment is set up with `.env.local`
2. Start the dev server: `pnpm dev`
3. Open browser DevTools to monitor network requests

### Test 1: Normal Sign Up Flow
1. Navigate to `/auth/sign-up`
2. Enter a new email and password
3. Submit the form
4. Verify:
   - User is redirected to dashboard
   - Profile exists in Supabase dashboard (Table: users)
   - No console errors

### Test 2: Sign In with Existing User
1. Sign out if logged in
2. Navigate to `/auth/sign-in`
3. Use credentials from Test 1
4. Verify:
   - Successful login
   - User data loads correctly
   - Session persists on page refresh

### Test 3: Webhook Failure Simulation
1. In Supabase dashboard, temporarily disable the webhook
2. Create a new user via sign-up
3. Check browser console for:
   - "Attempting to create profile..." warning
   - "Successfully created fallback user profile" message
4. Verify user can still access the app

### Test 4: Profile Recovery
1. Create a user normally
2. Manually delete their profile from the users table (keep auth.users record)
3. Have the user sign in
4. Verify:
   - Auth provider recreates the profile
   - No sign-out loop occurs
   - User can access the app normally

### Test 5: Session Persistence
1. Sign in as a user
2. Wait 5+ minutes (or modify the interval in auth-provider.tsx for testing)
3. Verify session check runs (check network tab)
4. Ensure user remains logged in

## Automated Test Script

Run the automated test:
```bash
node scripts/test-auth-flow.js
```

This script tests:
- User creation
- Profile creation (webhook and fallback)
- Session handling
- Retry logic

## Edge Cases to Monitor

1. **Concurrent Sign-ups**: Multiple users signing up simultaneously
2. **Network Issues**: Slow or interrupted connections during profile creation
3. **Database Constraints**: Duplicate email attempts
4. **Token Expiry**: Long-running sessions

## Production Considerations

1. Set up monitoring for:
   - Failed profile creations
   - Webhook failures
   - Auth loop attempts

2. Configure webhook secret in production:
   ```bash
   supabase secrets set WEBHOOK_SECRET="your-secret-value"
   ```

3. Monitor edge function logs for security violations

## Rollback Plan

If issues occur:
1. Remove retry logic from auth-provider.tsx
2. Revert to simple profile checking
3. Monitor webhook reliability
# Supabase Authentication Guide

## Overview

eatZone uses Supabase Auth for secure, centralized authentication with automatic demo mode support for development and preview environments.

## Environment Modes

### Production 🚀

- Standard Supabase authentication
- No demo accounts
- Full security enabled

### Development 🔧

- Auto-login with `dev@test.com` / `password`
- Orange-themed UI indicators
- Instant access for local development

### Preview 🌐

- Demo accounts for Vercel preview deployments
- Blue-themed UI with multiple test accounts
- Automatic detection of preview URLs (`*.vercel.app`)

## Demo Accounts

| Environment | Email                 | Password     | Auto-created |
| ----------- | --------------------- | ------------ | ------------ |
| Development | `dev@test.com`        | `password`   | Yes          |
| Preview     | `demo@eatzone.app`    | `demo123`    | Yes          |
| Preview     | `preview@eatzone.app` | `preview123` | Yes          |
| Preview     | `test@eatzone.app`    | `test123`    | Yes          |

## Authentication Flow

### 1. Session Management

```typescript
// Check current session
const {
  data: { session },
} = await supabase.auth.getSession();

// Listen for auth changes
supabase.auth.onAuthStateChange((event, session) => {
  // Handle sign in/out events
});
```

### 2. Demo Mode Detection

- `isDemoMode()`: Returns true in development or preview
- `getEnvironmentType()`: Returns 'development', 'preview', or 'production'
- `quickDemoLogin()`: Auto-authenticates with appropriate demo account

### 3. User Profile Sync

- Supabase Auth creates auth records
- App syncs user profiles to `users` table
- Profile data includes preferences and settings

## Key Features

### Automatic Demo Login

- Development and preview environments auto-login on first visit
- No manual account creation needed
- Seamless branch preview testing

### Session Persistence

- Supabase handles token refresh automatically
- Sessions persist across page reloads
- 5-minute periodic session validation

### Security

- Production environment has no demo mode
- Supabase Row Level Security (RLS) protects user data
- Each user can only access their own data

## Environment Variables

Required in `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_anon_key
SUPABASE_SECRET_KEY=your_service_key
```

## Troubleshooting

### Demo Login Not Working

1. Check browser console for environment detection
2. Verify Supabase connection in Network tab
3. Clear browser storage and retry
4. Check `.env.local` configuration

### Session Issues

1. Verify Supabase project is running
2. Check for auth token in localStorage
3. Monitor `onAuthStateChange` events
4. Review Supabase dashboard logs

### Preview Deployments

- Vercel automatically injects Supabase env vars
- Demo accounts are created on first login
- Each preview branch shares the same Supabase instance

## Migration from IndexedDB

The app previously used local IndexedDB for authentication. Key changes:

- Auth now centralized in Supabase
- Demo accounts exist in the database (not just locally)
- User data syncs across devices with same account
- Improved security with RLS policies

## Quick Commands

```bash
# Start local Supabase
pnpm supabase:start

# Reset database (includes auth)
pnpm supabase:reset

# Generate TypeScript types
pnpm supabase:types
```

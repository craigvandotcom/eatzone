# Setting Up Auth Hooks for User Profile Creation

## The Problem

Supabase Cloud doesn't allow direct database triggers on the `auth.users` table for security reasons. This means our trigger-based approach to create user profiles automatically doesn't work in the cloud environment.

## The Solution: Supabase Auth Hooks

### Option 1: Database Webhook (Recommended)

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Database → Webhooks**
4. Click **"Create a new webhook"**
5. Configure as follows:
   - **Name**: `create_user_profile`
   - **Table**: `auth.users`
   - **Events**: Select `INSERT`
   - **Type**: `Database Function`
   - **Function**: Select `public.handle_new_user` (from our migration)

### Option 2: Auth Hooks with PostgreSQL Function

1. Navigate to **Authentication → Hooks**
2. Find **"After Sign Up"** hook
3. Enable it and configure:
   - **Type**: PostgreSQL Function
   - **Function Schema**: `public`
   - **Function Name**: `handle_new_user`

### Option 3: Auth Hooks with HTTP Endpoint (Advanced)

If you deployed the Edge Function:

1. Deploy the edge function:
   ```bash
   supabase functions deploy handle-new-user
   ```

2. In Dashboard, go to **Authentication → Hooks**
3. Configure **"After Sign Up"** hook:
   - **Type**: HTTP
   - **URL**: Your edge function URL

## Testing

After setting up the webhook:

1. Sign up a new user
2. Check the `public.users` table - a profile should exist
3. Check webhook logs in the dashboard for any errors

## Current Fallback

Until hooks are configured, the app uses a fallback approach:
- Calls `ensure_user_profile` RPC function after signup
- Falls back to direct insert if needed

This ensures the app works, but Auth Hooks are the proper solution.

## Why This Matters

- **Security**: Supabase manages auth.users for security
- **Reliability**: Hooks are the official integration point
- **Performance**: Automatic profile creation without extra API calls
- **Maintenance**: Less code in your application
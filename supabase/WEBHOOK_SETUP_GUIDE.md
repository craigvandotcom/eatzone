# Production Webhook Setup Guide

This guide will walk you through setting up the production-ready webhook system for automatic user profile creation in Supabase.

## Prerequisites

1. Run the migration `004_production_auth_webhook.sql` in your Supabase SQL Editor
2. Verify the functions were created by running:
   ```sql
   SELECT proname FROM pg_proc WHERE proname LIKE 'handle_auth_%';
   ```

## Step 1: Create the INSERT Webhook

1. **Navigate to Database Webhooks**
   - Go to your [Supabase Dashboard](https://supabase.com/dashboard)
   - Select your project
   - Navigate to `Database` → `Webhooks`

2. **Create New Webhook**
   - Click **"Create a new webhook"**
   - Fill in the following:
     - **Name**: `on_auth_user_created`
     - **Table**: `auth.users`
     - **Events**: ✅ `INSERT` (uncheck others)
     - **Type**: `Supabase Function`
     - **Function**:
       - Schema: `public`
       - Function: `handle_auth_user_created`
     - **Method**: `POST`
     - **Headers**: Leave empty
     - **Params**: Leave empty

3. **Enable the Webhook**
   - Make sure the toggle is **ON**
   - Click **"Create webhook"**

## Step 2: Create the UPDATE Webhook (Optional but Recommended)

1. **Create Another Webhook**
   - Click **"Create a new webhook"** again
   - Fill in:
     - **Name**: `on_auth_user_updated`
     - **Table**: `auth.users`
     - **Events**: ✅ `UPDATE` (uncheck others)
     - **Type**: `Supabase Function`
     - **Function**:
       - Schema: `public`
       - Function: `handle_auth_user_updated`

2. **Enable and Save**

## Step 3: Verify Webhook Configuration

1. **Check Webhook Status**

   ```sql
   -- Run this in SQL Editor to check sync status
   SELECT * FROM public.check_user_profile_sync_status();
   ```

2. **View Webhook Logs**
   - Go to `Logs` → `Webhook Logs` in your dashboard
   - You should see successful executions after user signups

## Step 4: Test the Setup

### Option A: Test via SQL

```sql
-- Manually trigger profile creation for a test user
-- First, create a test auth user (if needed)
-- Then check if profile was created automatically
SELECT * FROM public.users ORDER BY created_at DESC LIMIT 5;
```

### Option B: Test via Application

1. Sign up a new user in your application
2. Check the `public.users` table - profile should exist immediately
3. Check webhook logs for the execution

## Step 5: Monitor Webhook Health

### Daily Health Check Query

```sql
-- Run this periodically to ensure webhooks are working
SELECT * FROM public.check_user_profile_sync_status();

-- If missing_profiles > 0, investigate and sync manually:
SELECT public.sync_single_user_profile(id)
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users);
```

### Set Up Alerts (Optional)

1. Go to `Logs` → `Alerts`
2. Create an alert for webhook failures
3. Set up email notifications

## Troubleshooting

### Webhook Not Triggering

1. Verify webhook is enabled (green toggle)
2. Check webhook logs for errors
3. Ensure functions have correct permissions:
   ```sql
   -- Check function permissions
   SELECT has_function_privilege('service_role', 'public.handle_auth_user_created()', 'EXECUTE');
   ```

### Profile Not Created

1. Check webhook execution logs
2. Run manual sync for specific user:
   ```sql
   SELECT public.sync_single_user_profile('user-uuid-here');
   ```

### Performance Issues

- Webhooks run asynchronously and shouldn't impact signup performance
- If you see delays, check the function execution time in logs

## Best Practices

1. **Don't Modify Webhook Functions Directly**
   - Always use migrations for changes
   - Test in a staging environment first

2. **Monitor Regularly**
   - Set up weekly checks of sync status
   - Review webhook failure logs

3. **Handle Edge Cases**
   - The functions handle duplicates gracefully
   - Errors are logged but don't block auth flow

## Rollback Plan

If you need to disable webhooks temporarily:

1. Toggle the webhook OFF in the dashboard
2. Your application code has retry logic as fallback
3. To fully remove:
   ```sql
   -- Remove webhooks from dashboard first, then:
   DROP FUNCTION IF EXISTS public.handle_auth_user_created() CASCADE;
   DROP FUNCTION IF EXISTS public.handle_auth_user_updated() CASCADE;
   ```

## Next Steps

After webhooks are working:

1. Remove any application-level profile creation code
2. Update error messages to be more user-friendly
3. Consider adding user metadata during signup for richer profiles

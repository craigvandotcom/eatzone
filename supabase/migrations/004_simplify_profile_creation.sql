-- Migration: Simplify profile creation following Supabase best practices
-- This migration cleans up webhook functions since we're handling profiles in application code

-- Note: We're not dropping functions from migration 003 since they might be in use
-- Instead, we'll add a deprecation notice and create simplified utilities

-- Add deprecation notices to webhook functions
COMMENT ON FUNCTION public.handle_auth_user_created() IS 
'DEPRECATED: Webhook function for creating user profiles. New approach handles profile creation in application code for better reliability.';

COMMENT ON FUNCTION public.handle_auth_user_updated() IS 
'DEPRECATED: Webhook function for updating user profiles. Updates are now handled in application code.';

-- Create utility function to sync existing users (one-time cleanup)
-- Drop if exists to avoid conflicts
DROP FUNCTION IF EXISTS public.sync_existing_auth_users();

CREATE FUNCTION public.sync_existing_auth_users()
RETURNS TABLE(synced_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    row_count INTEGER;
BEGIN
    -- Insert missing user profiles for existing auth users
    INSERT INTO public.users (id, email, created_at, updated_at)
    SELECT 
        au.id,
        au.email,
        au.created_at,
        au.created_at
    FROM auth.users au
    LEFT JOIN public.users pu ON au.id = pu.id
    WHERE pu.id IS NULL
    AND au.email IS NOT NULL;
    
    GET DIAGNOSTICS row_count = ROW_COUNT;
    
    RETURN QUERY SELECT row_count;
END;
$$;

-- The monitoring function already exists from migration 003, so we'll just update its comment
COMMENT ON FUNCTION public.check_user_profile_sync_status() IS 
'Utility function to monitor profile sync status. Note: Profile creation is now handled in application code, not via webhooks.';

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.sync_existing_auth_users() TO service_role;
GRANT EXECUTE ON FUNCTION public.check_user_profile_sync_status() TO service_role, authenticated;

-- Run initial sync to ensure all existing users have profiles
DO $$
DECLARE
    sync_result record;
BEGIN
    SELECT * INTO sync_result FROM public.sync_existing_auth_users();
    
    IF sync_result.synced_count > 0 THEN
        RAISE NOTICE 'Synced % existing users to profiles table', sync_result.synced_count;
    ELSE
        RAISE NOTICE 'All existing users already have profiles';
    END IF;
END $$;

-- Add helpful comments
COMMENT ON FUNCTION public.sync_existing_auth_users() IS 
'One-time sync function to create profiles for any existing auth users. Not needed for new signups as profiles are created in application code.';

COMMENT ON FUNCTION public.check_user_profile_sync_status() IS 
'Utility function to monitor profile sync status and identify any missing profiles.';
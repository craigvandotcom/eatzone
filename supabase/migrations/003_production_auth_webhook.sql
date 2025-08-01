-- Migration: Production-ready auth webhook setup
-- This migration creates a robust webhook function for automatic user profile creation

-- Drop any existing webhook functions to start fresh
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_auth_user_created() CASCADE;

-- Create the webhook function that will be called by Supabase
-- This function is designed specifically for Database Webhooks
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    profile_exists boolean;
BEGIN
    -- Check if profile already exists (defensive programming)
    SELECT EXISTS(
        SELECT 1 FROM public.users WHERE id = NEW.id
    ) INTO profile_exists;

    -- Only create profile if it doesn't exist
    IF NOT profile_exists THEN
        INSERT INTO public.users (
            id,
            email,
            username,
            created_at,
            updated_at
        ) VALUES (
            NEW.id,
            NEW.email,
            -- Extract username from metadata if provided during signup
            COALESCE(
                NEW.raw_user_meta_data->>'username',
                NEW.raw_user_meta_data->>'preferred_username',
                split_part(NEW.email, '@', 1) -- Default to email prefix
            ),
            COALESCE(NEW.created_at, NOW()),
            COALESCE(NEW.created_at, NOW())
        );

        -- Log successful creation
        RAISE LOG 'User profile created for % (ID: %)', NEW.email, NEW.id;
    ELSE
        -- Log that profile already exists
        RAISE LOG 'User profile already exists for % (ID: %)', NEW.email, NEW.id;
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN unique_violation THEN
        -- Handle race condition where profile might be created between check and insert
        RAISE LOG 'Profile already exists for % (caught unique_violation)', NEW.email;
        RETURN NEW;
    WHEN OTHERS THEN
        -- Log error but don't block auth flow
        RAISE WARNING 'Failed to create profile for %: % (SQLSTATE: %)', 
            NEW.email, SQLERRM, SQLSTATE;
        -- Still return NEW to not break the auth flow
        RETURN NEW;
END;
$$;

-- Create a function for handling email updates
CREATE OR REPLACE FUNCTION public.handle_auth_user_updated()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Only process if email changed
    IF OLD.email IS DISTINCT FROM NEW.email THEN
        UPDATE public.users
        SET 
            email = NEW.email,
            updated_at = NOW()
        WHERE id = NEW.id;
        
        RAISE LOG 'Updated email for user % from % to %', NEW.id, OLD.email, NEW.email;
    END IF;

    -- Update user metadata changes if needed
    IF OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data THEN
        -- Update username if it changed in metadata
        UPDATE public.users
        SET 
            username = COALESCE(
                NEW.raw_user_meta_data->>'username',
                NEW.raw_user_meta_data->>'preferred_username',
                username -- Keep existing if not in metadata
            ),
            updated_at = NOW()
        WHERE id = NEW.id
        AND (
            username IS DISTINCT FROM COALESCE(
                NEW.raw_user_meta_data->>'username',
                NEW.raw_user_meta_data->>'preferred_username',
                username
            )
        );
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Failed to update profile for %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;

-- Create a function to manually sync a single user (useful for debugging)
CREATE OR REPLACE FUNCTION public.sync_single_user_profile(user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    auth_user record;
    result jsonb;
BEGIN
    -- Get auth user data
    SELECT * INTO auth_user
    FROM auth.users
    WHERE id = user_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', 'Auth user not found'
        );
    END IF;

    -- Insert or update profile
    INSERT INTO public.users (
        id,
        email,
        username,
        created_at,
        updated_at
    ) VALUES (
        auth_user.id,
        auth_user.email,
        COALESCE(
            auth_user.raw_user_meta_data->>'username',
            auth_user.raw_user_meta_data->>'preferred_username',
            split_part(auth_user.email, '@', 1)
        ),
        auth_user.created_at,
        NOW()
    )
    ON CONFLICT (id) DO UPDATE
    SET 
        email = EXCLUDED.email,
        username = COALESCE(public.users.username, EXCLUDED.username),
        updated_at = NOW();

    RETURN jsonb_build_object(
        'success', true,
        'user_id', auth_user.id,
        'email', auth_user.email
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

-- Create a monitoring function to check webhook health
CREATE OR REPLACE FUNCTION public.check_user_profile_sync_status()
RETURNS TABLE (
    total_auth_users bigint,
    total_profiles bigint,
    missing_profiles bigint,
    orphaned_profiles bigint,
    sync_percentage numeric
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT
            (SELECT COUNT(*) FROM auth.users WHERE email IS NOT NULL) as auth_count,
            (SELECT COUNT(*) FROM public.users) as profile_count,
            (SELECT COUNT(*) FROM auth.users au 
             LEFT JOIN public.users pu ON au.id = pu.id 
             WHERE pu.id IS NULL AND au.email IS NOT NULL) as missing,
            (SELECT COUNT(*) FROM public.users pu 
             LEFT JOIN auth.users au ON pu.id = au.id 
             WHERE au.id IS NULL) as orphaned
    )
    SELECT
        auth_count,
        profile_count,
        missing,
        orphaned,
        CASE 
            WHEN auth_count = 0 THEN 100.0
            ELSE ROUND(((auth_count - missing)::numeric / auth_count::numeric) * 100, 2)
        END as sync_percentage
    FROM stats;
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_auth_user_created() TO service_role, postgres;
GRANT EXECUTE ON FUNCTION public.handle_auth_user_updated() TO service_role, postgres;
GRANT EXECUTE ON FUNCTION public.sync_single_user_profile(uuid) TO service_role, authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_profile_sync_status() TO service_role, authenticated;

-- Add helpful comments
COMMENT ON FUNCTION public.handle_auth_user_created() IS 
'Webhook function for creating user profiles when auth users are created. Designed for Supabase Database Webhooks.';

COMMENT ON FUNCTION public.handle_auth_user_updated() IS 
'Webhook function for updating user profiles when auth users are modified.';

COMMENT ON FUNCTION public.sync_single_user_profile(uuid) IS 
'Manually sync a single user profile. Returns success status and error details if any.';

COMMENT ON FUNCTION public.check_user_profile_sync_status() IS 
'Monitor the health of user profile synchronization. Shows stats about missing or orphaned profiles.';

-- Run initial sync to ensure all existing users have profiles
DO $$
DECLARE
    sync_count integer;
BEGIN
    INSERT INTO public.users (id, email, username, created_at, updated_at)
    SELECT 
        au.id,
        au.email,
        COALESCE(
            au.raw_user_meta_data->>'username',
            au.raw_user_meta_data->>'preferred_username',
            split_part(au.email, '@', 1)
        ),
        au.created_at,
        au.created_at
    FROM auth.users au
    LEFT JOIN public.users pu ON au.id = pu.id
    WHERE pu.id IS NULL
    AND au.email IS NOT NULL;
    
    GET DIAGNOSTICS sync_count = ROW_COUNT;
    
    IF sync_count > 0 THEN
        RAISE NOTICE 'Synced % existing users to profiles table', sync_count;
    END IF;
END $$;

-- Final status check
DO $$
DECLARE
    status record;
BEGIN
    SELECT * INTO status FROM public.check_user_profile_sync_status();
    
    RAISE NOTICE 'User Profile Sync Status - Auth Users: %, Profiles: %, Missing: %, Orphaned: %, Sync Rate: %', 
        status.total_auth_users,
        status.total_profiles,
        status.missing_profiles,
        status.orphaned_profiles,
        status.sync_percentage || '%';
        
    IF status.missing_profiles > 0 THEN
        RAISE WARNING 'There are % auth users without profiles. Run sync_single_user_profile() for each.', 
            status.missing_profiles;
    END IF;
END $$;
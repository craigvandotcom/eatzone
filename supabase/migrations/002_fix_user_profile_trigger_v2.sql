-- Migration: Fix user profile creation trigger (Supabase-compatible version)
-- This migration fixes issues with user profiles not being created on signup

-- First, let's check and fix any existing auth users without profiles
DO $$
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
    
    -- Get the number of rows affected
    GET DIAGNOSTICS row_count = ROW_COUNT;
    
    RAISE NOTICE 'Created % missing user profiles', row_count;
END $$;

-- For Supabase, we need to use a different approach since we can't directly create triggers on auth.users
-- Instead, we'll create a function that can be called by Supabase's auth hooks

-- First, try to drop the existing trigger if it exists (it might fail due to permissions)
DO $$
BEGIN
    -- Try to drop the trigger, but don't fail if we can't
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'Cannot drop trigger on auth.users (insufficient privileges). This is expected in Supabase.';
    WHEN OTHERS THEN
        RAISE NOTICE 'Error dropping trigger: %', SQLERRM;
END $$;

-- Drop existing function with CASCADE to remove any dependencies
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create function to handle new user creation (to be called by Supabase Auth Hook)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Insert the new user profile
    INSERT INTO public.users (id, email, username, created_at, updated_at)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', NULL),
        NEW.created_at,
        NEW.created_at
    )
    ON CONFLICT (id) DO NOTHING;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the signup
        RAISE LOG 'Error creating user profile for %: %', NEW.email, SQLERRM;
        RETURN NEW;
END;
$$;

-- Alternative approach: Create a function that can be called manually or via RPC
CREATE OR REPLACE FUNCTION public.create_user_profile(user_id uuid, user_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO public.users (id, email, created_at, updated_at)
    VALUES (user_id, user_email, NOW(), NOW())
    ON CONFLICT (id) DO NOTHING;
END;
$$;

-- Create a function to sync existing users (can be called via Supabase Dashboard)
CREATE OR REPLACE FUNCTION public.sync_user_profiles()
RETURNS TABLE(created_count integer)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    row_count INTEGER;
BEGIN
    -- Insert missing user profiles
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

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON public.users TO postgres, service_role;
GRANT SELECT ON public.users TO anon, authenticated;
GRANT UPDATE (username, updated_at) ON public.users TO authenticated;

-- RLS Policies
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.users;

-- Users can view their own profile
CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT
    USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Service role can do everything (needed for triggers/functions)
CREATE POLICY "Service role can manage all profiles" ON public.users
    FOR ALL
    USING (auth.role() = 'service_role')
    WITH CHECK (auth.role() = 'service_role');

-- Verify the fix worked
DO $$
DECLARE
    missing_profiles INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO missing_profiles
    FROM auth.users au
    LEFT JOIN public.users pu ON au.id = pu.id
    WHERE pu.id IS NULL
    AND au.email IS NOT NULL;
    
    IF missing_profiles > 0 THEN
        RAISE WARNING 'Still have % auth users without profiles! Run SELECT public.sync_user_profiles() to fix.', missing_profiles;
    ELSE
        RAISE NOTICE 'Success! All auth users now have profiles.';
    END IF;
END $$;

-- Add helpful comments
COMMENT ON FUNCTION public.handle_new_user() IS 'Creates a user profile when called by Supabase Auth Hook';
COMMENT ON FUNCTION public.create_user_profile(uuid, text) IS 'Manually create a user profile for a given auth user';
COMMENT ON FUNCTION public.sync_user_profiles() IS 'Sync all auth users to have profiles - returns count of profiles created';

-- IMPORTANT: After running this migration, you need to:
-- 1. Go to your Supabase Dashboard
-- 2. Navigate to Authentication > Hooks
-- 3. Enable "Create User Profile" hook or create a Database Webhook that calls handle_new_user()
-- 4. Or use Edge Functions to call create_user_profile() after signup
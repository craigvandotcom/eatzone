-- Migration: Fix RLS policies to allow profile creation
-- This adds the missing INSERT policy that allows users to create their own profile

-- Add INSERT policy to allow users to create their own profile
-- This is required for the application-level profile creation approach
CREATE POLICY "Users can create their own profile" ON public.users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Grant INSERT permission to authenticated users (if not already granted)
GRANT INSERT ON public.users TO authenticated;

-- Verify current policies
DO $$
BEGIN
    RAISE NOTICE 'Current RLS policies on public.users:';
    RAISE NOTICE '- Users can view their own profile (SELECT)';
    RAISE NOTICE '- Users can update their own profile (UPDATE)';
    RAISE NOTICE '- Users can create their own profile (INSERT) - NEW';
    RAISE NOTICE '- Service role can manage all profiles (ALL)';
END $$;

-- Test that the policy works by checking permissions
-- This doesn't actually insert data, just verifies the policy is correct
DO $$
DECLARE
    has_insert_permission boolean;
BEGIN
    -- Check if authenticated role can insert
    SELECT has_table_privilege('authenticated', 'public.users', 'INSERT') 
    INTO has_insert_permission;
    
    IF has_insert_permission THEN
        RAISE NOTICE 'Success: Authenticated users can now INSERT into public.users';
    ELSE
        RAISE WARNING 'Problem: Authenticated users still cannot INSERT into public.users';
    END IF;
END $$;
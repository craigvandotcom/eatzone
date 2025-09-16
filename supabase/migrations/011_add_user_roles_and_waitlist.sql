-- Migration: Add user roles and waitlist functionality
-- Description: Adds user_role enum and waitlist-related fields to users table

-- Create user_role enum type
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM ('waitlist', 'user', 'test_user', 'admin');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Add new columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS user_role user_role DEFAULT 'user';
ALTER TABLE users ADD COLUMN IF NOT EXISTS waitlist_joined_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES users(id);

-- Set existing users as admin (since Craig is the only user currently)
-- Future users will default to 'waitlist' role
UPDATE users
SET
  user_role = 'admin',
  approved_at = NOW()
WHERE user_role = 'user';

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(user_role);
CREATE INDEX IF NOT EXISTS idx_users_waitlist_joined ON users(waitlist_joined_at);
CREATE INDEX IF NOT EXISTS idx_users_approved_at ON users(approved_at);

-- Add comment for documentation
COMMENT ON COLUMN users.user_role IS 'User access level: waitlist (pending), user (standard), test_user (beta access), admin (full access)';
COMMENT ON COLUMN users.waitlist_joined_at IS 'When user joined the waitlist (nullable for existing users)';
COMMENT ON COLUMN users.approved_at IS 'When user was approved from waitlist (nullable for waitlist users)';
COMMENT ON COLUMN users.approved_by IS 'Which admin approved this user (nullable)';

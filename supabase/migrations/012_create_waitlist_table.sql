-- Migration: Create separate waitlist table
-- Description: Creates a dedicated waitlist table instead of using users table directly

-- Create waitlist table
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  user_role user_role DEFAULT 'waitlist',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  approved_at TIMESTAMP WITH TIME ZONE,
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_joined_at ON waitlist(joined_at);
CREATE INDEX IF NOT EXISTS idx_waitlist_role ON waitlist(user_role);

-- Enable RLS (Row Level Security)
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Create policies for waitlist table
-- Allow public insert (for joining waitlist)
CREATE POLICY "Allow public waitlist signup" ON waitlist
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow users to view their own waitlist entry
CREATE POLICY "Users can view own waitlist entry" ON waitlist
  FOR SELECT
  TO authenticated
  USING (email = auth.jwt() ->> 'email');

-- Allow admins to view and manage all waitlist entries
CREATE POLICY "Admins can manage waitlist" ON waitlist
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.user_role = 'admin'
    )
  );

-- Add comment for documentation
COMMENT ON TABLE waitlist IS 'Stores users waiting for approval to join the app';
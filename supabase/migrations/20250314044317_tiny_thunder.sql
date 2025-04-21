/*
  # Fix RLS Policies

  1. Changes
     - Drop all existing policies on profiles table
     - Create non-recursive policies for profiles table
     - Create helper functions for admin management
*/

-- First, drop all existing policies on the profiles table to start fresh
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create simple, non-recursive policy for users to view their own profile
CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  TO authenticated
  USING (id = auth.uid());

-- Create policy for users to update their own profile
CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  TO authenticated
  USING (id = auth.uid());

-- Create policy for users to insert their own profile
CREATE POLICY "Users can insert own profile" 
  ON profiles FOR INSERT 
  TO authenticated
  WITH CHECK (id = auth.uid());

-- Create a simple admin view policy using a direct non-recursive approach
CREATE POLICY "Admin view all profiles" 
  ON profiles FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 
      FROM auth.users 
      WHERE auth.users.id = auth.uid() AND auth.users.email = 'neej@exordiom.com'
    )
  );

-- Create stored procedures for admin management
CREATE OR REPLACE FUNCTION set_admin_profile(user_id UUID, user_email TEXT)
RETURNS VOID AS $$
BEGIN
  -- Check if profile exists
  IF EXISTS (SELECT 1 FROM profiles WHERE id = user_id) THEN
    -- Update existing profile
    UPDATE profiles
    SET is_admin = TRUE,
        email = user_email,
        updated_at = NOW()
    WHERE id = user_id;
  ELSE
    -- Create new profile
    INSERT INTO profiles (id, email, is_admin, created_at, updated_at)
    VALUES (user_id, user_email, TRUE, NOW(), NOW());
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to safely check admin status without recursion
CREATE OR REPLACE FUNCTION get_admin_status(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  admin_status BOOLEAN;
BEGIN
  SELECT is_admin INTO admin_status FROM profiles WHERE id = user_id;
  RETURN COALESCE(admin_status, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make sure the admin user is properly set up if they exist
UPDATE profiles
SET is_admin = true
WHERE email = 'neej@exordiom.com';
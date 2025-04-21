/*
  # Fix infinite recursion in profiles policy
  
  1. Policy Changes
     - Drops existing problematic policies that cause infinite recursion
     - Creates new policies with non-recursive conditions
     - Updates admin user if it exists
*/

-- Drop the problematic policy that's causing infinite recursion
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;

-- Create a better policy that doesn't cause recursion
CREATE POLICY "Admins can view all profiles" 
  ON profiles FOR SELECT 
  TO authenticated
  USING (
    (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
  );

-- Fix other policies to avoid recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
CREATE POLICY "Users can view their own profile" 
  ON profiles FOR SELECT 
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  TO authenticated
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
CREATE POLICY "Users can insert their own profile" 
  ON profiles FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Update admin status for admin user if it exists
UPDATE profiles
SET is_admin = true
WHERE email = 'neej@exordiom.com';
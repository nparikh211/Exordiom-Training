/*
  # Fix Database Permissions and Row Level Security Policies

  1. Policies
    - Remove potentially recursive RLS policies
    - Create simpler, direct RLS policies for user access
    - Create admin access policies based on email address instead of recursion
    
  2. Admin Functions
    - Create/update functions for managing admin profiles
    - Add helper functions for checking admin status safely
*/

-- First check if the policies exist and drop only if they exist
DO $$
BEGIN
    -- Drop profile policies if they exist
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can view all profiles' AND tablename = 'profiles') THEN
        DROP POLICY "Admins can view all profiles" ON profiles;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin view all profiles' AND tablename = 'profiles') THEN
        DROP POLICY "Admin view all profiles" ON profiles;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own profile' AND tablename = 'profiles') THEN
        DROP POLICY "Users can view their own profile" ON profiles;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own profile' AND tablename = 'profiles') THEN
        DROP POLICY "Users can view own profile" ON profiles;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own profile' AND tablename = 'profiles') THEN
        DROP POLICY "Users can update their own profile" ON profiles;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own profile' AND tablename = 'profiles') THEN
        DROP POLICY "Users can update own profile" ON profiles;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert their own profile' AND tablename = 'profiles') THEN
        DROP POLICY "Users can insert their own profile" ON profiles;
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own profile' AND tablename = 'profiles') THEN
        DROP POLICY "Users can insert own profile" ON profiles;
    END IF;
    
    -- Check for training progress policies and DON'T drop if they already exist
    -- This is the part that was causing the error
END $$;

-- Create simple policies without recursion
-- 1. Basic access for own profiles (only create if they don't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own profile' AND tablename = 'profiles') THEN
        CREATE POLICY "Users can view own profile" 
        ON profiles FOR SELECT 
        TO authenticated
        USING (id = auth.uid());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own profile' AND tablename = 'profiles') THEN
        CREATE POLICY "Users can update own profile" 
        ON profiles FOR UPDATE 
        TO authenticated
        USING (id = auth.uid());
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own profile' AND tablename = 'profiles') THEN
        CREATE POLICY "Users can insert own profile" 
        ON profiles FOR INSERT 
        TO authenticated
        WITH CHECK (id = auth.uid());
    END IF;
END $$;

-- 2. Admin access based on email (non-recursive approach)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin view all profiles' AND tablename = 'profiles') THEN
        CREATE POLICY "Admin view all profiles" 
        ON profiles FOR SELECT 
        TO authenticated
        USING (
            auth.jwt() ->> 'email' = 'neej@exordiom.com'
        );
    END IF;
END $$;

-- 5. Make sure the admin functions are created correctly
CREATE OR REPLACE FUNCTION set_admin_profile(user_id UUID, user_email TEXT)
RETURNS VOID AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM profiles WHERE id = user_id) THEN
    -- Update existing profile
    UPDATE profiles
    SET is_admin = TRUE,
        email = user_email,
        updated_at = NOW()
    WHERE id = user_id;
  ELSE
    -- Create new profile
    INSERT INTO profiles (id, email, is_admin, first_name, last_name, created_at, updated_at)
    VALUES (user_id, user_email, TRUE, '', '', NOW(), NOW());
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_admin_status(user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  admin_status BOOLEAN;
  user_email TEXT;
BEGIN
  -- Get the user email from auth.users if possible
  SELECT email INTO user_email FROM auth.users WHERE id = user_id;
  
  -- Check if it's the known admin email
  IF user_email = 'neej@exordiom.com' THEN
    RETURN TRUE;
  END IF;
  
  -- Otherwise check the profiles table
  SELECT is_admin INTO admin_status FROM profiles WHERE id = user_id;
  RETURN COALESCE(admin_status, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update admin status for any existing profile with the admin email
UPDATE profiles
SET is_admin = TRUE
WHERE email = 'neej@exordiom.com';
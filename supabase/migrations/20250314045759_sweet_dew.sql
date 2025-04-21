-- Comprehensive fix for admin permissions and policies
-- First, drop all existing policies on the profiles table to start fresh
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admin view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;

-- Create simple policies without recursion
-- 1. Basic access for own profiles
CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  TO authenticated
  USING (id = auth.uid());

CREATE POLICY "Users can insert own profile" 
  ON profiles FOR INSERT 
  TO authenticated
  WITH CHECK (id = auth.uid());

-- 2. Admin access based on email (non-recursive approach)
CREATE POLICY "Admin view all profiles" 
  ON profiles FOR SELECT 
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'neej@exordiom.com'
  );

-- 3. Policies for training progress
DROP POLICY IF EXISTS "Users can view their own training progress" ON training_progress;
DROP POLICY IF EXISTS "Users can insert their own training progress" ON training_progress;
DROP POLICY IF EXISTS "Users can update their own training progress" ON training_progress;
DROP POLICY IF EXISTS "Admins can view all training progress" ON training_progress;

CREATE POLICY "Users can view own training progress" 
  ON training_progress FOR SELECT 
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own training progress" 
  ON training_progress FOR INSERT 
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own training progress" 
  ON training_progress FOR UPDATE 
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all training progress" 
  ON training_progress FOR SELECT 
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'neej@exordiom.com'
  );

-- 4. Policies for quiz attempts
DROP POLICY IF EXISTS "Users can view their own quiz attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Users can insert their own quiz attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Users can update their own quiz attempts" ON quiz_attempts;
DROP POLICY IF EXISTS "Admins can view all quiz attempts" ON quiz_attempts;

CREATE POLICY "Users can view own quiz attempts" 
  ON quiz_attempts FOR SELECT 
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own quiz attempts" 
  ON quiz_attempts FOR INSERT 
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own quiz attempts" 
  ON quiz_attempts FOR UPDATE 
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all quiz attempts" 
  ON quiz_attempts FOR SELECT 
  TO authenticated
  USING (
    auth.jwt() ->> 'email' = 'neej@exordiom.com'
  );

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

-- Mark the admin user explicitly to avoid errors
UPDATE profiles
SET is_admin = TRUE
WHERE email = 'neej@exordiom.com';
/*
  # Create stored procedures for admin management
  
  1. Functions
     - set_admin_profile: Creates or updates admin profile
     - get_admin_status: Safely checks if a user is an admin without RLS recursion
*/

-- Create function to safely set admin profile
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
  RETURN admin_status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
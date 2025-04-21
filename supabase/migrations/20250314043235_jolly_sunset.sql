/*
  # Create admin user
  
  1. Manual Creation
    - Creates the admin user if it doesn't exist or updates it if it does
*/

-- First, check if the admin user exists in auth.users
DO $$
DECLARE
  admin_exists BOOLEAN;
  admin_id UUID;
BEGIN
  -- Check if the admin user exists in auth.users
  SELECT EXISTS (
    SELECT 1 FROM auth.users WHERE email = 'neej@exordiom.com'
  ) INTO admin_exists;
  
  -- Get the admin ID if it exists
  SELECT id INTO admin_id FROM auth.users WHERE email = 'neej@exordiom.com';
  
  IF admin_exists THEN
    -- Update the profile to ensure admin status is set
    UPDATE public.profiles
    SET is_admin = true
    WHERE email = 'neej@exordiom.com';
    
    RAISE NOTICE 'Admin user updated with ID: %', admin_id;
  ELSE
    RAISE NOTICE 'Admin user does not exist in auth.users.';
    -- Cannot create auth users directly in SQL, needs to be done through API
  END IF;
  
  -- Ensure RLS policy exists for admin
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Admins can view all profiles'
  ) THEN
    CREATE POLICY "Admins can view all profiles" 
      ON profiles FOR SELECT 
      USING (EXISTS (
        SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
      ));
    RAISE NOTICE 'Admin policy created.';
  END IF;
END $$;
/*
  # Fix Training Progress Table Queries

  1. Changes
    - Add proper RLS policies for training_progress table
    - Ensure upsert functionality works correctly
    - Fix issues with single row queries returning error when no row found
*/

-- Drop and recreate proper policies for training progress
DROP POLICY IF EXISTS "Users can view own training progress" ON training_progress;
DROP POLICY IF EXISTS "Users can insert own training progress" ON training_progress;
DROP POLICY IF EXISTS "Users can update own training progress" ON training_progress;
DROP POLICY IF EXISTS "Admins can view all training progress" ON training_progress;

-- Create policies that avoid recursion
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

-- Create a helper function to get or create training progress
CREATE OR REPLACE FUNCTION get_or_create_training_progress(
  p_user_id UUID, 
  p_section_id TEXT
) 
RETURNS UUID AS $$
DECLARE
  v_progress_id UUID;
BEGIN
  -- Try to get existing progress
  SELECT id INTO v_progress_id 
  FROM training_progress 
  WHERE user_id = p_user_id AND section_id = p_section_id;
  
  -- If not found, create new record
  IF v_progress_id IS NULL THEN
    INSERT INTO training_progress (user_id, section_id, completed, created_at, updated_at)
    VALUES (p_user_id, p_section_id, FALSE, NOW(), NOW())
    RETURNING id INTO v_progress_id;
  END IF;
  
  RETURN v_progress_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
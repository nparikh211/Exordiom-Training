/*
  # Fix Training Progress Single Row Selection

  This migration creates a function to safely handle training progress
  records, avoiding the "single row expected" error when no records are found.
*/

-- Create a function to safely handle training progress records
CREATE OR REPLACE FUNCTION get_training_progress(
  p_user_id UUID,
  p_section_id TEXT
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  section_id TEXT,
  completed BOOLEAN,
  completion_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY 
  SELECT tp.id, tp.user_id, tp.section_id, tp.completed, tp.completion_date, tp.created_at, tp.updated_at
  FROM training_progress tp
  WHERE tp.user_id = p_user_id AND tp.section_id = p_section_id;
  
  -- If no rows returned, return a row with NULL values
  IF NOT FOUND THEN
    RETURN;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to initialize or get training progress
CREATE OR REPLACE FUNCTION init_training_progress(
  p_user_id UUID,
  p_section_id TEXT
)
RETURNS UUID AS $$
DECLARE
  v_progress_id UUID;
BEGIN
  -- Check if progress exists
  SELECT id INTO v_progress_id
  FROM training_progress
  WHERE user_id = p_user_id AND section_id = p_section_id;
  
  -- If not found, create it
  IF v_progress_id IS NULL THEN
    INSERT INTO training_progress (
      user_id, 
      section_id, 
      completed, 
      completion_date,
      created_at, 
      updated_at
    )
    VALUES (
      p_user_id, 
      p_section_id, 
      FALSE, 
      NULL,
      NOW(), 
      NOW()
    )
    RETURNING id INTO v_progress_id;
  END IF;
  
  RETURN v_progress_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
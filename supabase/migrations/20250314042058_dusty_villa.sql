/*
  # Training Platform Schema

  1. New Tables
    - `profiles`
      - Stores user profile information (first name, last name)
    - `training_progress`
      - Tracks user progress through training modules
    - `quiz_attempts`
      - Records user quiz attempts and scores
    - `quiz_questions`
      - Stores quiz questions and answer options

  2. Security
    - Enable RLS on all tables
    - Add policies for users to read/write their own data
    - Add admin access policies
*/

-- Create profiles table for user details
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text,
  last_name text,
  email text UNIQUE NOT NULL,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create training progress table
CREATE TABLE IF NOT EXISTS training_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  section_id text NOT NULL, -- 'section1', 'section2', 'section3'
  completed boolean DEFAULT false,
  completion_date timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, section_id)
);

-- Create quiz attempts table
CREATE TABLE IF NOT EXISTS quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  score integer NOT NULL,
  passed boolean DEFAULT false,
  attempt_number integer NOT NULL,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create quiz questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  option_a text NOT NULL,
  option_b text NOT NULL,
  option_c text NOT NULL,
  option_d text NOT NULL,
  correct_answer text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Insert quiz questions
INSERT INTO quiz_questions (question, option_a, option_b, option_c, option_d, correct_answer)
VALUES
  ('You''re late for a scheduled virtual meeting due to internet issues. What should you do?', 
   'Join without explanation.', 
   'Ignore the meeting completely.', 
   'Immediately inform your manager via email or messaging.', 
   'Wait for someone to ask why you were absent.', 
   'C'),
  ('You have an idea during a meeting, but someone else is currently speaking. What is the best course of action?', 
   'Interrupt loudly to share immediately.', 
   'Write it down and share when appropriate.', 
   'Hold onto the idea and share it later in private.', 
   'Keep the idea to yourself.', 
   'B'),
  ('A colleague repeatedly shares inappropriate jokes in a group chat. How should you respond?', 
   'Laugh along to fit in.', 
   'Discuss publicly in the chat.', 
   'Ignore the situation entirely.', 
   'Report the issue to HR or your supervisor discreetly.', 
   'D'),
  ('You need time off for personal reasons. What is the most professional way to handle this?', 
   'Call in sick unexpectedly.', 
   'Inform your supervisor proactively and truthfully.', 
   'Simply don''t show up.', 
   'Create a convincing excuse.', 
   'B'),
  ('Your supervisor provides critical feedback regarding your recent performance. How should you react?', 
   'Disagree and defend your actions aggressively.', 
   'Avoid future interactions.', 
   'Accept the feedback gracefully and seek improvement.', 
   'Challenge their assessment immediately.', 
   'C'),
  ('You realize a project deadline isn''t achievable with current resources. What''s your next step?', 
   'Continue quietly without adjustments.', 
   'Work overtime without discussing.', 
   'Notify your manager with a realistic alternative.', 
   'Wait and see if the deadline changes.', 
   'C'),
  ('You''re at a company networking event but feeling shy. How should you best handle this situation?', 
   'Stay quiet and leave early.', 
   'Wait for colleagues to approach you first.', 
   'Attend briefly without speaking.', 
   'Prepare conversation starters and proactively engage colleagues.', 
   'D'),
  ('Your workspace is poorly lit during video calls. How should you address this?', 
   'Turn off your camera during meetings.', 
   'Attend meetings without fixing the issue.', 
   'Adjust lighting or relocate to a brighter space.', 
   'Blame technical issues.', 
   'C'),
  ('A team member suggests a radical idea in a meeting. How do you respond?', 
   'Quickly dismiss the idea publicly.', 
   'Politely encourage further exploration of the idea.', 
   'Change the subject to another topic.', 
   'Remain silent and wait for others'' reactions.', 
   'B'),
  ('Your child becomes ill unexpectedly, affecting your availability. What''s your approach?', 
   'Wait until someone notices your absence.', 
   'Delegate your tasks quietly without informing anyone.', 
   'Communicate promptly and clearly with your supervisor.', 
   'Attempt to multitask without notification.', 
   'C');

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY "Users can view their own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
  ON profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
  ON profiles FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- Policies for training_progress
CREATE POLICY "Users can view their own training progress" 
  ON training_progress FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own training progress" 
  ON training_progress FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own training progress" 
  ON training_progress FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all training progress" 
  ON training_progress FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- Policies for quiz_attempts
CREATE POLICY "Users can view their own quiz attempts" 
  ON quiz_attempts FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quiz attempts" 
  ON quiz_attempts FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quiz attempts" 
  ON quiz_attempts FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all quiz attempts" 
  ON quiz_attempts FOR SELECT 
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- Policies for quiz_questions
CREATE POLICY "Anyone can view quiz questions" 
  ON quiz_questions FOR SELECT 
  USING (true);

CREATE POLICY "Only admins can modify quiz questions" 
  ON quiz_questions FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true
  ));

-- Function to update timestamptz columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at timestamp
CREATE TRIGGER set_updated_at_profiles
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_training_progress
BEFORE UPDATE ON training_progress
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_quiz_attempts
BEFORE UPDATE ON quiz_attempts
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_updated_at_quiz_questions
BEFORE UPDATE ON quiz_questions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create a trigger function for setting admin status
CREATE OR REPLACE FUNCTION set_admin_for_specific_email()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.email = 'neej@exordiom.com' THEN
    NEW.is_admin := true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically set admin status for the specific email
CREATE TRIGGER set_admin_on_profile_insert
BEFORE INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION set_admin_for_specific_email();
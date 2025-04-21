export interface ProfileData {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
}

export interface TrainingSection {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: string;
}

export interface TrainingProgress {
  id: string;
  user_id: string;
  section_id: string;
  completed: boolean;
  completion_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: string;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  score: number;
  passed: boolean;
  attempt_number: number;
  started_at: string;
  completed_at: string | null;
}

export interface UserTrainingData {
  profile: ProfileData;
  progress: TrainingProgress[];
  quizAttempts: QuizAttempt[];
  completedTraining: boolean;
  nextSection: string | null;
}

export interface UserQuizAnswer {
  questionId: string;
  selectedAnswer: string;
  correct: boolean;
}
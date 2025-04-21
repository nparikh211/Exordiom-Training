export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          first_name: string | null
          last_name: string | null
          email: string
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          first_name?: string | null
          last_name?: string | null
          email: string
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          first_name?: string | null
          last_name?: string | null
          email?: string
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      training_progress: {
        Row: {
          id: string
          user_id: string
          section_id: string
          completed: boolean
          completion_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          section_id: string
          completed?: boolean
          completion_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          section_id?: string
          completed?: boolean
          completion_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      quiz_attempts: {
        Row: {
          id: string
          user_id: string
          score: number
          passed: boolean
          attempt_number: number
          started_at: string
          completed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          score: number
          passed?: boolean
          attempt_number: number
          started_at?: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          score?: number
          passed?: boolean
          attempt_number?: number
          started_at?: string
          completed_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      quiz_questions: {
        Row: {
          id: string
          question: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          correct_answer: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          question: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          correct_answer: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          question?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          correct_answer?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Insertable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updatable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
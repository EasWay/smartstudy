/**
 * User Profile Types
 * Based on the Supabase profiles table schema
 */

export interface UserProfile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  school: string | null;
  grade_level: string | null;
  subjects_of_interest: string[] | null;
  created_at: string;
  updated_at: string;
}

export interface CreateProfileData {
  username?: string;
  full_name?: string;
  avatar_url?: string;
  school?: string;
  grade_level?: string;
  subjects_of_interest?: string[];
}

export interface UpdateProfileData {
  username?: string;
  full_name?: string;
  avatar_url?: string;
  school?: string;
  grade_level?: string;
  subjects_of_interest?: string[];
}

// Grade level options for Ghana education system
export const GRADE_LEVELS = [
  'Primary 1',
  'Primary 2', 
  'Primary 3',
  'Primary 4',
  'Primary 5',
  'Primary 6',
  'JHS 1',
  'JHS 2',
  'JHS 3',
  'SHS 1',
  'SHS 2',
  'SHS 3',
  'University',
  'Other'
] as const;

export type GradeLevel = typeof GRADE_LEVELS[number];

// Common subjects in Ghana education system
export const SUBJECTS = [
  'Mathematics',
  'English Language',
  'Science',
  'Social Studies',
  'Integrated Science',
  'Physics',
  'Chemistry',
  'Biology',
  'Geography',
  'History',
  'Economics',
  'Government',
  'Literature',
  'French',
  'Information Technology',
  'Technical Drawing',
  'Visual Arts',
  'Music',
  'Physical Education',
  'Religious Studies'
] as const;

export type Subject = typeof SUBJECTS[number];
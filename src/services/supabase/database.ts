import { supabase } from './client';
import { UserProfile, CreateProfileData, UpdateProfileData } from '../../types/profile';

export class DatabaseService {
  // Test database connection
  static async testConnection() {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (error && error.code !== 'PGRST116') { // PGRST116 = table doesn't exist yet
        throw error;
      }

      return { connected: true, error: null };
    } catch (error) {
      console.error('Database connection test failed:', error);
      return { connected: false, error: error as Error };
    }
  }

  // Create user profile
  static async createProfile(userId: string, profileData: CreateProfileData) {
    try {
      // Check for existing profiles with same username, email, or full name
      if (profileData.username) {
        const { data: existingUsername } = await supabase
          .from('profiles')
          .select('id, username')
          .eq('username', profileData.username)
          .neq('id', userId);

        if (existingUsername && existingUsername.length > 0) {
          return {
            data: null,
            error: new Error(`Username "${profileData.username}" is already taken. Please choose a different username.`)
          };
        }
      }

      // Get user's email from auth to check for duplicates
      const { data: authUser } = await supabase.auth.getUser();
      if (authUser.user?.email && profileData.full_name) {
        const { data: existingEmail } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('full_name', profileData.full_name)
          .neq('id', userId);

        if (existingEmail && existingEmail.length > 0) {
          return {
            data: null,
            error: new Error(`A user with the name "${profileData.full_name}" already exists. Please use a different name.`)
          };
        }
      }

      // Check if a profile already exists for this user ID
      const { data: existingProfiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', userId);

      if (existingProfiles && existingProfiles.length > 0) {
        console.log('Profile already exists for user, updating instead of creating');
        // Update existing profile instead of creating a new one
        const { data, error } = await supabase
          .from('profiles')
          .update(profileData)
          .eq('id', userId)
          .select()
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) throw error;
        return { data: data[0] as UserProfile, error: null };
      }

      // Create new profile
      const { data, error } = await supabase
        .from('profiles')
        .insert([
          {
            id: userId,
            ...profileData,
          },
        ])
        .select()
        .single();

      if (error) {
        // Handle unique constraint violations
        if (error.code === '23505') {
          if (error.message.includes('username')) {
            return {
              data: null,
              error: new Error(`Username "${profileData.username}" is already taken. Please choose a different username.`)
            };
          }
          return {
            data: null,
            error: new Error('This profile information is already in use. Please use different details.')
          };
        }

        // If table doesn't exist, provide helpful error message
        if (error.code === 'PGRST116') {
          const tableError = new Error(
            'Profiles table does not exist. Please run the database migration first. ' +
            'Go to your Supabase dashboard > SQL Editor and run the migration from ' +
            'src/services/supabase/migrations/001_create_profiles_table.sql'
          );
          return { data: null, error: tableError };
        }
        throw error;
      }
      return { data: data as UserProfile, error: null };
    } catch (error) {
      console.error('Create profile error:', error);
      return { data: null, error: error as Error };
    }
  }

  // Get user profile
  static async getProfile(userId: string) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { data: data as UserProfile, error: null };
    } catch (error) {
      console.error('Get profile error:', error);
      return { data: null, error: error as Error };
    }
  }

  // Update user profile
  static async updateProfile(userId: string, updates: UpdateProfileData) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) throw error;
      return { data: data as UserProfile, error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      return { data: null, error: error as Error };
    }
  }

  // Check if user has completed profile setup
  static async hasCompletedProfile(userId: string): Promise<boolean> {
    try {
      console.log('Checking profile completion for user ID:', userId);

      // Use limit(1) instead of single() to avoid the multiple rows error
      const { data, error } = await supabase
        .from('profiles')
        .select('username, full_name, school, grade_level, subjects_of_interest')
        .eq('id', userId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) {
        console.log('Profile check error:', error.code, error.message);
        // If table doesn't exist, user hasn't completed setup
        if (error.code === 'PGRST116') {
          console.log('Profiles table does not exist');
          return false;
        }
        throw error;
      }

      // Check if we got any results
      if (!data || data.length === 0) {
        console.log('No profile found for user:', userId);
        return false;
      }

      const profile = data[0]; // Get the first (and should be only) profile
      console.log('Profile data retrieved:', profile);

      // Check if all required fields are filled
      const isComplete = !!(
        profile?.username &&
        profile?.full_name &&
        profile?.school &&
        profile?.grade_level &&
        profile?.subjects_of_interest &&
        profile.subjects_of_interest.length > 0
      );

      console.log('Profile completion result for user', userId, ':', isComplete);
      console.log('Profile fields check:', {
        username: !!profile?.username,
        full_name: !!profile?.full_name,
        school: !!profile?.school,
        grade_level: !!profile?.grade_level,
        subjects_of_interest: !!profile?.subjects_of_interest,
        subjects_count: profile?.subjects_of_interest?.length || 0
      });

      return isComplete;
    } catch (error) {
      console.error('Check profile completion error:', error);
      return false;
    }
  }
}
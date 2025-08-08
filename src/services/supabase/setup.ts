import { supabase } from './client';

export class DatabaseSetup {
  /**
   * Create the profiles table with proper schema and policies
   * This should be run in the Supabase SQL editor or via migration
   */
  static async createProfilesTable() {
    try {
      // Note: This is the SQL that should be executed in Supabase dashboard
      const sql = `
        -- Create profiles table (extends Supabase auth.users)
        CREATE TABLE IF NOT EXISTS profiles (
          id UUID REFERENCES auth.users PRIMARY KEY,
          username TEXT UNIQUE,
          full_name TEXT,
          avatar_url TEXT,
          school TEXT,
          grade_level TEXT,
          subjects_of_interest TEXT[],
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Enable Row Level Security (RLS)
        ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

        -- Create policies for profile access
        -- Users can view their own profile
        CREATE POLICY "Users can view own profile" ON profiles
          FOR SELECT USING (auth.uid() = id);

        -- Users can insert their own profile
        CREATE POLICY "Users can insert own profile" ON profiles
          FOR INSERT WITH CHECK (auth.uid() = id);

        -- Users can update their own profile
        CREATE POLICY "Users can update own profile" ON profiles
          FOR UPDATE USING (auth.uid() = id);

        -- Create function to handle updated_at timestamp
        CREATE OR REPLACE FUNCTION handle_updated_at()
        RETURNS TRIGGER AS $$
        BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        -- Create trigger to automatically update updated_at
        CREATE TRIGGER handle_profiles_updated_at
          BEFORE UPDATE ON profiles
          FOR EACH ROW
          EXECUTE FUNCTION handle_updated_at();

        -- Create function to automatically create profile on user signup
        CREATE OR REPLACE FUNCTION public.handle_new_user()
        RETURNS TRIGGER AS $$
        BEGIN
          INSERT INTO public.profiles (id, full_name, avatar_url)
          VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'avatar_url');
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;

        -- Create trigger to automatically create profile on user signup
        CREATE TRIGGER on_auth_user_created
          AFTER INSERT ON auth.users
          FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
      `;

      console.log('Execute this SQL in your Supabase dashboard SQL editor:');
      console.log(sql);
      
      return { success: true, sql };
    } catch (error) {
      console.error('Database setup error:', error);
      return { success: false, error: error as Error };
    }
  }

  /**
   * Test if the profiles table exists and is accessible
   */
  static async testProfilesTable() {
    try {
      // Try to query the profiles table
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (error) {
        if (error.code === 'PGRST116') {
          return { 
            exists: false, 
            error: 'Profiles table does not exist. Please run the migration first.' 
          };
        }
        throw error;
      }
      
      return { exists: true, error: null };
    } catch (error) {
      console.error('Profiles table test failed:', error);
      return { exists: false, error: error as Error };
    }
  }

  /**
   * Test basic CRUD operations on profiles table
   */
  static async testProfilesCRUD() {
    try {
      // First check if table exists
      const tableTest = await this.testProfilesTable();
      if (!tableTest.exists) {
        return { success: false, error: tableTest.error };
      }

      // Test basic operations (this will only work with authenticated user)
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { 
          success: false, 
          error: 'No authenticated user. CRUD test requires authentication.' 
        };
      }

      // Test SELECT
      const { data: selectData, error: selectError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id);

      if (selectError) {
        return { success: false, error: `SELECT test failed: ${selectError.message}` };
      }

      console.log('CRUD test passed - profiles table is accessible');
      return { success: true, data: selectData };
    } catch (error) {
      console.error('CRUD test failed:', error);
      return { success: false, error: error as Error };
    }
  }
}
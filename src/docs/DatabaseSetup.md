# Database Setup for Resource Management

## Overview

The resource management functionality requires additional database tables and columns that need to be set up in your Supabase database. This guide will help you set up the required database schema.

## Quick Setup

Run the setup script to get the SQL commands you need to execute:

```bash
npm run setup-db
```

This will display the SQL commands you need to run in your Supabase SQL Editor.

## Manual Setup

If you prefer to set up the database manually, follow these steps:

### Step 1: Add Storage Tracking to Profiles Table

Execute this SQL in your Supabase SQL Editor:

```sql
-- Add storage tracking columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS storage_used BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS storage_limit BIGINT DEFAULT 104857600; -- 100MB default

-- Update existing profiles to have default storage values
UPDATE profiles 
SET storage_used = 0, storage_limit = 104857600 
WHERE storage_used IS NULL OR storage_limit IS NULL;

-- Add index for efficient storage queries
CREATE INDEX IF NOT EXISTS idx_profiles_storage_usage ON profiles(storage_used);
```

### Step 2: Create Resources Tables

Execute this SQL to create the resources, bookmarks, and file_uploads tables:

```sql
-- Create resources table
CREATE TABLE IF NOT EXISTS resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT CHECK (resource_type IN ('document', 'link', 'video', 'book', 'image')),
  file_url TEXT,
  file_path TEXT, -- Storage path for Supabase Storage
  file_size BIGINT, -- File size in bytes
  file_type TEXT, -- MIME type
  thumbnail_url TEXT, -- Generated thumbnail for images/videos
  external_url TEXT,
  subject TEXT,
  grade_level TEXT,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE CASCADE,
  is_public BOOLEAN DEFAULT true,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookmarks table
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, resource_id)
);

-- Create file uploads tracking table
CREATE TABLE IF NOT EXISTS file_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  bucket_name TEXT NOT NULL,
  upload_status TEXT CHECK (upload_status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  resource_id UUID REFERENCES resources(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);
```

### Step 3: Create Indexes

Add indexes for better performance:

```sql
-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_resources_uploaded_by ON resources(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_resources_created_at ON resources(created_at);
CREATE INDEX IF NOT EXISTS idx_resources_subject ON resources(subject);
CREATE INDEX IF NOT EXISTS idx_resources_resource_type ON resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_resources_is_public ON resources(is_public);

CREATE INDEX IF NOT EXISTS idx_bookmarks_user_id ON bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_resource_id ON bookmarks(resource_id);

CREATE INDEX IF NOT EXISTS idx_file_uploads_user_id ON file_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_status ON file_uploads(upload_status);
```

### Step 4: Enable Row Level Security

Enable RLS and create security policies:

```sql
-- Enable Row Level Security
ALTER TABLE resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE file_uploads ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for resources table
CREATE POLICY "Users can view public resources" ON resources
  FOR SELECT USING (is_public = true OR uploaded_by = auth.uid());

CREATE POLICY "Users can insert their own resources" ON resources
  FOR INSERT WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "Users can update their own resources" ON resources
  FOR UPDATE USING (uploaded_by = auth.uid());

CREATE POLICY "Users can delete their own resources" ON resources
  FOR DELETE USING (uploaded_by = auth.uid());

-- Create RLS policies for bookmarks table
CREATE POLICY "Users can view their own bookmarks" ON bookmarks
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own bookmarks" ON bookmarks
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own bookmarks" ON bookmarks
  FOR DELETE USING (user_id = auth.uid());

-- Create RLS policies for file_uploads table
CREATE POLICY "Users can view their own file uploads" ON file_uploads
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own file uploads" ON file_uploads
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own file uploads" ON file_uploads
  FOR UPDATE USING (user_id = auth.uid());
```

### Step 5: Create Update Trigger

Create a trigger to automatically update the `updated_at` timestamp:

```sql
-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_resources_updated_at 
    BEFORE UPDATE ON resources 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

## Verification

After running the setup, you can verify that everything is working by:

1. **Check Tables Exist**: Go to your Supabase dashboard > Table Editor and verify that you see:
   - `profiles` table with `storage_used` and `storage_limit` columns
   - `resources` table
   - `bookmarks` table
   - `file_uploads` table

2. **Test the App**: Try uploading a resource in the app to verify the database integration works.

3. **Check Storage Tracking**: Upload a file and check that the `storage_used` column in the profiles table is updated.

## Troubleshooting

### Common Issues

1. **"column profiles.storage_used does not exist"**
   - Make sure you ran the ALTER TABLE command for the profiles table
   - Check that the columns were added successfully in the Supabase dashboard

2. **"relation resources does not exist"**
   - Make sure you created the resources table
   - Verify the table exists in your Supabase dashboard

3. **Permission Denied Errors**
   - Ensure RLS policies are created correctly
   - Check that the policies allow the operations you're trying to perform

4. **Foreign Key Constraint Errors**
   - Make sure the profiles table exists before creating resources table
   - Verify that user IDs exist in the profiles table

### Getting Help

If you encounter issues:

1. Check the Supabase dashboard logs for detailed error messages
2. Verify your environment variables are set correctly
3. Ensure your Supabase project has the necessary permissions
4. Check the browser console for client-side errors

## Migration Files

The migration files are located in:
- `src/services/supabase/migrations/002_add_storage_tracking.sql`
- `src/services/supabase/migrations/003_create_resources_table.sql`

These files contain the complete SQL needed for the setup and can be used as reference.

## Next Steps

After completing the database setup:

1. Test the resource upload functionality
2. Try the resource management screen
3. Verify storage usage tracking works
4. Test bulk deletion operations

The resource management features should now work correctly with your database!
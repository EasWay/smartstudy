-- Migration: Create resources table for educational materials
-- This migration creates the resources table and related tables for the education app

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

-- Add comments for documentation
COMMENT ON TABLE resources IS 'Educational resources uploaded by users';
COMMENT ON TABLE bookmarks IS 'User bookmarks for resources';
COMMENT ON TABLE file_uploads IS 'Tracking table for file upload operations';

COMMENT ON COLUMN resources.file_path IS 'Path to file in Supabase Storage';
COMMENT ON COLUMN resources.file_size IS 'File size in bytes for storage tracking';
COMMENT ON COLUMN resources.resource_type IS 'Type of resource: document, link, video, book, image';
COMMENT ON COLUMN resources.is_public IS 'Whether resource is publicly visible';

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
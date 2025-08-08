-- Storage bucket setup for file uploads
-- Run this in your Supabase SQL editor after creating the 'gfiles' bucket

-- Enable RLS on storage.objects if not already enabled
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Authenticated users can upload files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;

-- Policy for authenticated users to upload files to gfiles bucket
CREATE POLICY "Authenticated users can upload files" ON storage.objects
FOR INSERT WITH CHECK (
  auth.role() = 'authenticated' AND
  bucket_id = 'gfiles'
);

-- Policy for authenticated users to view files in gfiles bucket
-- This allows users to view files they have access to (e.g., in their groups)
CREATE POLICY "Users can view files in gfiles" ON storage.objects
FOR SELECT USING (
  auth.role() = 'authenticated' AND
  bucket_id = 'gfiles'
);

-- Policy for authenticated users to delete their own files
-- Files are organized by user ID in the path structure
CREATE POLICY "Users can delete their own files" ON storage.objects
FOR DELETE USING (
  auth.role() = 'authenticated' AND
  bucket_id = 'gfiles' AND
  auth.uid()::text = (storage.foldername(name))[2] -- Second folder level is user ID
);

-- Policy for authenticated users to update their own files
CREATE POLICY "Users can update their own files" ON storage.objects
FOR UPDATE USING (
  auth.role() = 'authenticated' AND
  bucket_id = 'gfiles' AND
  auth.uid()::text = (storage.foldername(name))[2] -- Second folder level is user ID
);

-- Create bucket if it doesn't exist (this might require admin privileges)
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('gfiles', 'gfiles', false)
-- ON CONFLICT (id) DO NOTHING;

-- Verify the policies were created
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage'
ORDER BY policyname;
-- Supabase Storage Bucket Configuration and RLS Policies
-- This file contains the SQL policies that need to be applied in the Supabase dashboard
-- for the four storage buckets: useravatars, edresources, gfiles, temuploads
--
-- NOTE: This is a simplified version that works without requiring other database tables.
-- Some policies will be updated later when the resources, study_groups, and group_members tables are created.

-- =====================================================
-- BUCKET CREATION (Done via Supabase Dashboard)
-- =====================================================
-- 1. useravatars: Public bucket for profile pictures
-- 2. edresources: Private bucket for study materials  
-- 3. gfiles: Private bucket for group file sharing
-- 4. temuploads: Private bucket for temporary file processing

-- =====================================================
-- USER AVATARS BUCKET POLICIES
-- =====================================================

-- Allow users to upload their own avatars
CREATE POLICY "Users can upload their own avatars" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'useravatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to update their own avatars
CREATE POLICY "Users can update their own avatars" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'useravatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own avatars
CREATE POLICY "Users can delete their own avatars" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'useravatars' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow anyone to view avatars (public bucket)
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT USING (bucket_id = 'useravatars');

-- =====================================================
-- EDUCATIONAL RESOURCES BUCKET POLICIES
-- =====================================================

-- Allow authenticated users to upload educational resources
CREATE POLICY "Users can upload educational resources" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'edresources' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to update their own resources
CREATE POLICY "Users can update their own resources" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'edresources' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own resources
CREATE POLICY "Users can delete their own resources" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'edresources' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow access to own resources (simplified - will be updated when resources table exists)
CREATE POLICY "Users can view their own resources" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'edresources' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================
-- GROUP FILES BUCKET POLICIES
-- =====================================================

-- Allow authenticated users to upload group files (simplified - will be updated when group tables exist)
CREATE POLICY "Users can upload group files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'gfiles' AND 
    auth.uid()::text = (storage.foldername(name))[2]
  );

-- Allow users to update their own group files
CREATE POLICY "Users can update their own group files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'gfiles' AND 
    auth.uid()::text = (storage.foldername(name))[2]
  );

-- Allow users to delete their own group files
CREATE POLICY "Users can delete their own group files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'gfiles' AND 
    auth.uid()::text = (storage.foldername(name))[2]
  );

-- Allow users to view group files they have access to (simplified)
CREATE POLICY "Users can view accessible group files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'gfiles' AND 
    auth.uid()::text = (storage.foldername(name))[2]
  );

-- =====================================================
-- TEMPORARY UPLOADS BUCKET POLICIES
-- =====================================================

-- Allow authenticated users to upload to temp bucket
CREATE POLICY "Users can upload to temp bucket" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'temuploads' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to update their own temp files
CREATE POLICY "Users can update their own temp files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'temuploads' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to delete their own temp files
CREATE POLICY "Users can delete their own temp files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'temuploads' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow users to view their own temp files
CREATE POLICY "Users can view their own temp files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'temuploads' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================
-- BUCKET CONFIGURATION NOTES
-- =====================================================

/*
BUCKET SETTINGS TO CONFIGURE IN SUPABASE DASHBOARD:

1. useravatars:
   - Public: true
   - File size limit: 5MB
   - Allowed MIME types: image/jpeg, image/png, image/webp
   - Auto-cleanup: false

2. edresources:
   - Public: false (controlled by RLS)
   - File size limit: 50MB
   - Allowed MIME types: PDF, DOC, DOCX, PPT, PPTX, images, videos
   - Auto-cleanup: false

3. gfiles:
   - Public: false (group members only)
   - File size limit: 25MB
   - Allowed MIME types: PDF, DOC, DOCX, images, videos, text
   - Auto-cleanup: false

4. temuploads:
   - Public: false (user only)
   - File size limit: 100MB
   - Allowed MIME types: all
   - Auto-cleanup: true (24 hours)

FOLDER STRUCTURE:
- useravatars: /{user_id}/{filename}
- edresources: /{user_id}/{filename}
- gfiles: /{group_id}/{user_id}/{filename}
- temuploads: /{user_id}/{timestamp}_{filename}
*/
-- Advanced Supabase Storage RLS Policies
-- This file contains the advanced policies that should be applied AFTER the database tables are created
-- These policies provide more sophisticated access control based on database relationships

-- =====================================================
-- ADVANCED EDUCATIONAL RESOURCES POLICIES
-- =====================================================

-- Replace the basic policy with advanced public/private resource access
DROP POLICY IF EXISTS "Users can view their own resources" ON storage.objects;

CREATE POLICY "Advanced resource access control" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'edresources' AND
    (
      -- Public resources (check resources table)
      EXISTS (
        SELECT 1 FROM resources 
        WHERE file_path = name AND is_public = true
      ) OR
      -- Own resources
      auth.uid()::text = (storage.foldername(name))[1]
    )
  );

-- =====================================================
-- ADVANCED GROUP FILES POLICIES
-- =====================================================

-- Replace basic group file policies with advanced group membership checks
DROP POLICY IF EXISTS "Users can upload group files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own group files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own group files" ON storage.objects;
DROP POLICY IF EXISTS "Users can view accessible group files" ON storage.objects;

-- Allow group members to upload files to their groups
CREATE POLICY "Group members can upload files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'gfiles' AND
    EXISTS (
      SELECT 1 FROM group_members gm
      JOIN study_groups sg ON gm.group_id = sg.id
      WHERE gm.user_id = auth.uid() AND
            sg.id::text = (storage.foldername(name))[1]
    )
  );

-- Allow group members to update files in their groups
CREATE POLICY "Group members can update group files" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'gfiles' AND
    EXISTS (
      SELECT 1 FROM group_members gm
      JOIN study_groups sg ON gm.group_id = sg.id
      WHERE gm.user_id = auth.uid() AND
            sg.id::text = (storage.foldername(name))[1]
    )
  );

-- Allow group members and file owners to delete files
CREATE POLICY "Group members can delete group files" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'gfiles' AND
    (
      -- File owner can delete
      auth.uid()::text = (storage.foldername(name))[2] OR
      -- Group admin can delete
      EXISTS (
        SELECT 1 FROM group_members gm
        JOIN study_groups sg ON gm.group_id = sg.id
        WHERE gm.user_id = auth.uid() AND
              gm.role = 'admin' AND
              sg.id::text = (storage.foldername(name))[1]
      )
    )
  );

-- Allow group members to view group files
CREATE POLICY "Group members can view group files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'gfiles' AND
    EXISTS (
      SELECT 1 FROM group_members gm
      JOIN study_groups sg ON gm.group_id = sg.id
      WHERE gm.user_id = auth.uid() AND
            sg.id::text = (storage.foldername(name))[1]
    )
  );

-- =====================================================
-- USAGE INSTRUCTIONS
-- =====================================================

/*
WHEN TO APPLY THESE POLICIES:

1. Apply the basic policies from storage-policies.sql first (Task 6.1)
2. Apply these advanced policies AFTER creating the database tables:
   - resources table (Stage 7)
   - study_groups table (Stage 8)
   - group_members table (Stage 8)

FOLDER STRUCTURE FOR ADVANCED POLICIES:
- useravatars: /{user_id}/{filename}
- edresources: /{user_id}/{filename}
- gfiles: /{group_id}/{user_id}/{filename}  <- group_id in first folder, user_id in second
- temuploads: /{user_id}/{timestamp}_{filename}

The advanced policies provide:
- Public/private resource access control
- Group membership-based file access
- Admin privileges for group file management
- Proper security isolation between groups
*/
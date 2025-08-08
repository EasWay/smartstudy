# Supabase Storage RLS Policies Implementation Guide

This document explains how to implement and test Row Level Security (RLS) policies for the Ghana Education App's storage buckets.

## Overview

The app uses 4 storage buckets with specific access control policies:

1. **useravatars** - Public bucket for profile pictures
2. **edresources** - Private bucket for educational resources
3. **gfiles** - Private bucket for group file sharing
4. **temuploads** - Private bucket for temporary file processing

## Implementation Steps

### Step 1: Create Storage Buckets

In your Supabase dashboard, create the following buckets:

#### 1. useravatars
- **Public**: ✅ Yes
- **File size limit**: 5MB
- **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`
- **Auto-cleanup**: ❌ No

#### 2. edresources
- **Public**: ❌ No (controlled by RLS)
- **File size limit**: 50MB
- **Allowed MIME types**: PDF, DOC, DOCX, PPT, PPTX, images, videos
- **Auto-cleanup**: ❌ No

#### 3. gfiles
- **Public**: ❌ No (group members only)
- **File size limit**: 25MB
- **Allowed MIME types**: PDF, DOC, DOCX, images, videos, text
- **Auto-cleanup**: ❌ No

#### 4. temuploads
- **Public**: ❌ No (user only)
- **File size limit**: 100MB
- **Allowed MIME types**: All
- **Auto-cleanup**: ✅ Yes (24 hours)

### Step 2: Apply RLS Policies

Copy and execute the SQL from `src/services/supabase/storage-policies.sql` in your Supabase SQL editor.

### Step 3: Test Policies

Run the test suite to verify policies are working:

```bash
# Run the test suite
npm test -- storage-policies.test.ts

# Or run manual tests
npx ts-node src/services/supabase/__tests__/storage-policies.test.ts
```

## Policy Details

### User Avatars Bucket Policies

```sql
-- Users can upload/update/delete their own avatars
-- Path structure: /{user_id}/{filename}
-- Anyone can view avatars (public bucket)
```

**What this allows:**
- ✅ Users can upload profile pictures to their own folder
- ✅ Users can update their existing avatars
- ✅ Users can delete their own avatars
- ✅ Anyone can view avatar images (public access)
- ❌ Users cannot upload to other users' folders

### Educational Resources Bucket Policies

```sql
-- Users can upload/update/delete their own resources
-- Path structure: /{user_id}/{filename}
-- Access controlled by resources table (when implemented)
```

**What this allows:**
- ✅ Users can upload educational materials to their own folder
- ✅ Users can manage their own uploaded resources
- ✅ Users can view their own private resources
- ✅ Public resources are viewable by all (when resources table exists)
- ❌ Users cannot access other users' private resources

### Group Files Bucket Policies

```sql
-- Group members can upload/view files in their groups
-- Path structure: /{group_id}/{user_id}/{filename}
-- Access controlled by group membership (when implemented)
```

**What this allows:**
- ✅ Group members can upload files to their groups
- ✅ Group members can view all files in their groups
- ✅ Group admins can delete any group files
- ✅ File owners can delete their own files
- ❌ Non-members cannot access group files

### Temporary Uploads Bucket Policies

```sql
-- Users can upload/manage files in their temp folder
-- Path structure: /{user_id}/{timestamp}_{filename}
-- Auto-cleanup after 24 hours
```

**What this allows:**
- ✅ Users can upload files for temporary processing
- ✅ Users can manage their own temp files
- ✅ Files are automatically cleaned up after 24 hours
- ❌ Users cannot access other users' temp files

## Folder Structure

Each bucket uses a specific folder structure for access control:

```
useravatars/
├── {user_id_1}/
│   ├── avatar.jpg
│   └── profile-pic.png
└── {user_id_2}/
    └── avatar.webp

edresources/
├── {user_id_1}/
│   ├── study-guide.pdf
│   └── notes.docx
└── {user_id_2}/
    └── presentation.pptx

gfiles/
├── {group_id_1}/
│   ├── {user_id_1}/
│   │   └── shared-notes.pdf
│   └── {user_id_2}/
│       └── assignment.docx
└── {group_id_2}/
    └── {user_id_3}/
        └── project-files.zip

temuploads/
├── {user_id_1}/
│   ├── temp_1234567890_upload.pdf
│   └── temp_1234567891_image.jpg
└── {user_id_2}/
    └── temp_1234567892_document.docx
```

## Testing Scenarios

The test suite covers these security scenarios:

### ✅ Allowed Operations
- Users uploading to their own folders
- Users viewing their own files
- Public access to avatar images
- Group members accessing group files (when membership exists)

### ❌ Blocked Operations
- Users uploading to other users' folders
- Users accessing other users' private files
- Non-members accessing group files
- Unauthorized access to temp files

## Advanced Policies

After implementing the database tables (resources, study_groups, group_members), apply the advanced policies from `storage-policies-advanced.sql` for:

- Public/private resource access control
- Group membership-based file access
- Admin privileges for group file management
- Enhanced security isolation

## Troubleshooting

### Common Issues

1. **Upload fails with "row-level security policy" error**
   - Check that the user is authenticated
   - Verify the file path follows the correct structure
   - Ensure the bucket exists and policies are applied

2. **Cannot view files that should be accessible**
   - Check bucket public/private settings
   - Verify RLS policies are enabled
   - Test with correct folder structure

3. **Group file access not working**
   - Ensure group membership tables exist
   - Apply advanced policies after database setup
   - Verify group membership data is correct

### Debug Commands

```typescript
// Test bucket access
const { data, error } = await supabase.storage
  .from('bucketname')
  .list('folder');

// Test file upload
const { error } = await supabase.storage
  .from('bucketname')
  .upload('path/file.txt', file);

// Check current user
const { data: user } = await supabase.auth.getUser();
```

## Security Best Practices

1. **Always use proper folder structure** - Policies depend on consistent paths
2. **Validate file types and sizes** - Implement client-side validation
3. **Monitor storage usage** - Track user storage quotas
4. **Regular security audits** - Test policies with different user scenarios
5. **Backup important files** - Implement backup strategies for critical data

## Next Steps

After implementing basic RLS policies:

1. ✅ Test all policy scenarios
2. ⏳ Implement database tables (resources, study_groups, group_members)
3. ⏳ Apply advanced policies for enhanced security
4. ⏳ Add file processing and optimization features
5. ⏳ Implement storage usage monitoring and quotas
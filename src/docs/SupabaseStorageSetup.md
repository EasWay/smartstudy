# Supabase Storage Setup Guide

This guide explains how to configure the four storage buckets required for the Ghana Education App in your Supabase dashboard.

## Overview

The app uses four storage buckets for different types of file storage:

1. **user-avatars** - Profile pictures (public)
2. **educational-resources** - Study materials and documents (private with RLS)
3. **group-files** - Files shared in study groups (private with RLS)
4. **temp-uploads** - Temporary file processing (private)

## Step 1: Create Storage Buckets

### 1.1 Access Supabase Dashboard
1. Go to your Supabase project dashboard
2. Navigate to **Storage** in the left sidebar
3. Click **Create a new bucket**

### 1.2 Create user-avatars Bucket
- **Name**: `user-avatars`
- **Public**: ✅ **Enabled** (public read access)
- **File size limit**: 5MB
- **Allowed MIME types**: `image/jpeg`, `image/png`, `image/webp`

### 1.3 Create educational-resources Bucket
- **Name**: `educational-resources`
- **Public**: ❌ **Disabled** (controlled by RLS policies)
- **File size limit**: 50MB
- **Allowed MIME types**: 
  - `application/pdf`
  - `application/msword`
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
  - `application/vnd.ms-powerpoint`
  - `application/vnd.openxmlformats-officedocument.presentationml.presentation`
  - `image/jpeg`, `image/png`, `image/webp`
  - `video/mp4`, `video/webm`

### 1.4 Create group-files Bucket
- **Name**: `group-files`
- **Public**: ❌ **Disabled** (group members only)
- **File size limit**: 25MB
- **Allowed MIME types**:
  - `application/pdf`
  - `application/msword`
  - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
  - `image/jpeg`, `image/png`, `image/webp`
  - `video/mp4`
  - `text/plain`

### 1.5 Create temp-uploads Bucket
- **Name**: `temp-uploads`
- **Public**: ❌ **Disabled** (user only)
- **File size limit**: 100MB
- **Allowed MIME types**: All types (for processing)

## Step 2: Apply Row Level Security Policies

### 2.1 Access SQL Editor
1. In your Supabase dashboard, go to **SQL Editor**
2. Create a new query
3. Copy and paste the contents of `src/services/supabase/storage-policies.sql`
4. Execute the query to apply all RLS policies

### 2.2 Verify Policies
After applying the policies, verify they're active:
1. Go to **Authentication** > **Policies**
2. Check that policies exist for the `storage.objects` table
3. Ensure all four buckets have their respective policies

## Step 3: Configure Bucket Settings

### 3.1 File Organization Structure
The app organizes files using the following folder structure:

```
user-avatars/
├── {user_id}/
│   └── avatar.jpg

educational-resources/
├── {user_id}/
│   ├── document1.pdf
│   └── presentation.pptx

group-files/
├── {group_id}/
│   └── {user_id}/
│       ├── shared_notes.pdf
│       └── group_project.docx

temp-uploads/
├── {user_id}/
│   ├── {timestamp}_temp_file.pdf
│   └── {timestamp}_processing.jpg
```

### 3.2 Auto-cleanup Configuration
For the `temp-uploads` bucket, set up automatic cleanup:
1. Go to **Database** > **Functions**
2. Create a new function to clean up files older than 24 hours
3. Set up a cron job to run this function daily

```sql
-- Function to clean up temp uploads
CREATE OR REPLACE FUNCTION cleanup_temp_uploads()
RETURNS void AS $$
BEGIN
  -- Delete files older than 24 hours from temp-uploads bucket
  DELETE FROM storage.objects 
  WHERE bucket_id = 'temp-uploads' 
  AND created_at < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

-- Create cron job (requires pg_cron extension)
SELECT cron.schedule('cleanup-temp-uploads', '0 2 * * *', 'SELECT cleanup_temp_uploads();');
```

## Step 4: Test Storage Configuration

### 4.1 Test Bucket Access
1. Use the Supabase dashboard to upload test files to each bucket
2. Verify that public buckets are accessible via public URLs
3. Test that private buckets require authentication

### 4.2 Test RLS Policies
1. Create test users in the Authentication section
2. Try uploading files as different users
3. Verify that users can only access their own files and public resources

### 4.3 Test File Operations
Use the StorageService class to test:
- File uploads with progress tracking
- File downloads and signed URL generation
- File deletion and storage usage updates
- Storage quota enforcement

## Step 5: Environment Configuration

Ensure your app has the correct environment variables:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Troubleshooting

### Common Issues

1. **Upload fails with "Policy violation"**
   - Check that RLS policies are correctly applied
   - Verify user authentication status
   - Ensure file path follows the expected structure

2. **Public URLs not working**
   - Verify bucket is set to public
   - Check that files are in the correct folder structure

3. **File size limits exceeded**
   - Check bucket configuration in dashboard
   - Verify client-side validation matches server limits

4. **MIME type restrictions**
   - Update allowed MIME types in bucket settings
   - Ensure client validation matches server configuration

### Monitoring Storage Usage

1. Set up monitoring for storage usage per user
2. Create alerts for users approaching storage limits
3. Monitor bucket sizes and performance metrics

## Security Considerations

1. **File Validation**: Always validate file types and sizes on both client and server
2. **Virus Scanning**: Consider implementing virus scanning for uploaded files
3. **Access Logging**: Monitor file access patterns for security
4. **Rate Limiting**: Implement upload rate limiting to prevent abuse
5. **Content Moderation**: Consider automated content moderation for public uploads

## Next Steps

After completing the storage setup:
1. Test the StorageService class with real file uploads
2. Implement image processing and thumbnail generation
3. Add progress tracking for file uploads
4. Set up monitoring and alerting for storage usage
5. Implement file sharing features in study groups

This storage configuration provides a secure, scalable foundation for file management in the Ghana Education App.
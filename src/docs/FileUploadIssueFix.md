# File Upload Issue Fix Guide

## Problem Identified
The file upload is failing with "Network request failed" error because the `gfiles` storage bucket doesn't exist in your Supabase project.

## Root Cause
From the logs and diagnostic tests, we found:
- ❌ The `gfiles` bucket is missing from your Supabase project
- ❌ Without the bucket, all upload attempts fail with network errors
- ❌ The retry mechanism exhausts all attempts (3x) and fails

## Solution Steps

### Step 1: Create the Storage Bucket
1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: `vmrwfbkahlsjetgqhoof`
3. Navigate to **Storage > Buckets**
4. Click **"Create bucket"**
5. Configure the bucket:
   - **Name**: `gfiles`
   - **Public**: `false` (keep private for security)
   - **File size limit**: `10MB` (recommended)
   - **Allowed MIME types**: Leave empty for all types
6. Click **"Create bucket"**

### Step 2: Set Up Storage Policies
1. Go to **SQL Editor** in your Supabase dashboard
2. Run the SQL script from `src/services/supabase/storage-bucket-setup.sql`
3. This will create the necessary Row Level Security (RLS) policies

### Step 3: Verify Setup
Run the diagnostic script to verify everything is working:
```bash
cd Stem
node scripts/setup-storage-bucket.js
```

### Step 4: Test the Fix
Run the comprehensive test:
```bash
node scripts/test-upload-fix.js
```

## Code Improvements Made

### Enhanced Upload Service
- ✅ Better error handling and logging
- ✅ Timeout protection for network requests
- ✅ Exponential backoff for retries
- ✅ File size validation (10MB limit)
- ✅ Progress callback improvements
- ✅ Detailed error reporting

### New Utilities Added
- ✅ `BucketManager` class for bucket health checks
- ✅ `sanitizeFilename` utility for safe file names
- ✅ Comprehensive test suite for upload functionality

## File Structure Changes
```
Stem/
├── scripts/
│   ├── debug-upload-network-issue.js     # Network diagnostics
│   ├── setup-storage-bucket.js           # Bucket setup verification
│   └── test-upload-fix.js                # Comprehensive testing
├── src/
│   ├── services/
│   │   └── storage/
│   │       ├── bucketManager.ts           # Bucket management utilities
│   │       ├── uploadFileWithSession.ts   # Enhanced upload service
│   │       └── __tests__/
│   │           └── uploadFileWithSession.test.ts  # Unit tests
│   ├── utils/
│   │   └── sanitizeFilename.ts            # Filename sanitization
│   └── docs/
│       └── FileUploadIssueFix.md          # This guide
└── src/services/supabase/
    └── storage-bucket-setup.sql           # SQL setup script
```

## Expected Behavior After Fix

### Before Fix
```
LOG  Starting file upload: {"bucket": "gfiles", "filePath": "...", "fileUri": "..."}
LOG  User authenticated: 7c9987b4-0251-4022-8131-218248320702
LOG  File blob created: {"size": 141686, "type": "image/jpeg"}
LOG  Upload attempt 1/3
ERROR Upload attempt 1 failed: [StorageUnknownError: Network request failed]
LOG  Upload attempt 2/3
ERROR Upload attempt 2 failed: [StorageUnknownError: Network request failed]
LOG  Upload attempt 3/3
ERROR Upload attempt 3 failed: [StorageUnknownError: Network request failed]
ERROR All upload attempts failed: [StorageUnknownError: Network request failed]
```

### After Fix
```
LOG  Starting file upload: {"bucket": "gfiles", "filePath": "...", "fileUri": "..."}
LOG  User authenticated: 7c9987b4-0251-4022-8131-218248320702
LOG  File blob created: {"size": 141686, "type": "image/jpeg"}
LOG  Upload attempt 1/3
LOG  Upload attempt 1 successful
LOG  Upload successful: {"path": "...", "hasPublicUrl": true}
```

## Testing Checklist

After implementing the fix, test these scenarios:

- [ ] Small text file upload (< 1KB)
- [ ] Image file upload (100KB - 1MB)
- [ ] Document file upload (PDF, DOC)
- [ ] Large file upload (5-10MB)
- [ ] Network interruption handling
- [ ] Authentication failure handling
- [ ] File type validation
- [ ] Progress callback functionality

## Monitoring and Debugging

### Key Logs to Monitor
1. **Authentication**: `User authenticated: [user-id]`
2. **File Processing**: `File blob created: {size, type}`
3. **Upload Progress**: `Upload attempt X/3`
4. **Success**: `Upload successful: {path, hasPublicUrl}`
5. **Errors**: Any error messages with detailed context

### Common Issues After Fix
1. **RLS Policy Issues**: Users can't upload → Check storage policies
2. **File Size Limits**: Large files fail → Adjust size limits
3. **MIME Type Restrictions**: Certain files rejected → Update bucket settings
4. **Network Timeouts**: Slow uploads fail → Increase timeout values

## Performance Optimizations

### Implemented
- ✅ File size validation before upload
- ✅ Timeout protection (30s fetch, 60s upload)
- ✅ Exponential backoff for retries
- ✅ Progress tracking for user feedback

### Future Improvements
- [ ] Chunked upload for large files
- [ ] Background upload queue
- [ ] Offline upload support
- [ ] Image compression before upload
- [ ] Upload resumption on failure

## Security Considerations

### Current Security Measures
- ✅ Authentication required for all uploads
- ✅ RLS policies restrict access to user's own files
- ✅ File size limits prevent abuse
- ✅ Private bucket (not publicly accessible)

### Additional Security Recommendations
- [ ] File type validation on server side
- [ ] Virus scanning for uploaded files
- [ ] Rate limiting for uploads
- [ ] Content moderation for images
- [ ] Automatic file cleanup for old files

## Support and Troubleshooting

If you encounter issues after following this guide:

1. **Run Diagnostics**: Use the provided scripts to identify issues
2. **Check Logs**: Monitor both client and server logs
3. **Verify Setup**: Ensure bucket and policies are correctly configured
4. **Test Incrementally**: Start with small files and work up
5. **Network Testing**: Test on different networks/devices

For additional help, check:
- Supabase Storage documentation
- React Native file handling guides
- Network debugging tools in React Native debugger
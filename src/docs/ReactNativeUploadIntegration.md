# React Native Upload Integration Guide

## Problem: "No content provided" Error

Your app is getting a 400 error with "No content provided" and only 162 bytes content-length, indicating the file data isn't reaching Supabase properly.

## Root Cause

React Native file handling requires specific approaches that differ from web browsers. The main issues are:

1. **Blob incompatibility**: React Native Blob objects don't serialize properly for Supabase uploads
2. **File URI handling**: React Native file URIs need special processing
3. **FormData structure**: React Native expects a specific FormData structure

## Solution: Use the Optimized Upload Function

### Step 1: Import the New Function

```typescript
import { uploadFileWithSessionReactNative } from '../services/storage/uploadFileWithSessionReactNative';
```

### Step 2: Update Your File Upload Code

**Before (problematic):**
```typescript
// This causes "No content provided" error
const result = await uploadFileWithSessionFixed(
  fileUri,
  filePath,
  bucket,
  onProgress
);
```

**After (fixed):**
```typescript
// This properly handles React Native files
const file = {
  uri: fileUri,
  name: fileName,
  type: mimeType,
  size: fileSize // optional but recommended
};

const result = await uploadFileWithSessionReactNative(
  file,
  filePath,
  bucket,
  onProgress
);
```

### Step 3: Ensure Proper File Object Structure

The new function expects a file object with this structure:

```typescript
interface ReactNativeFile {
  uri: string;      // File URI (file:// or content:// or data:)
  name: string;     // Original filename
  type: string;     // MIME type (e.g., 'image/jpeg')
  size?: number;    // File size in bytes (optional)
}
```

## Example Integration

### Image Picker Integration

```typescript
import * as ImagePicker from 'expo-image-picker';
import { uploadFileWithSessionReactNative } from '../services/storage/uploadFileWithSessionReactNative';

async function handleImageUpload() {
  try {
    // Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      
      // Create file object for React Native upload
      const file = {
        uri: asset.uri,
        name: `image_${Date.now()}.jpg`,
        type: 'image/jpeg',
        size: asset.fileSize, // Available in some cases
      };

      // Generate upload path
      const filePath = `${groupId}/${userId}/${file.name}`;

      // Upload with progress tracking
      const uploadResult = await uploadFileWithSessionReactNative(
        file,
        filePath,
        'gfiles',
        (progress) => {
          console.log(`Upload progress: ${progress}%`);
          setUploadProgress(progress);
        }
      );

      if (uploadResult) {
        console.log('Upload successful:', uploadResult.path);
        // Handle success
      } else {
        console.error('Upload failed');
        // Handle error
      }
    }
  } catch (error) {
    console.error('Image upload error:', error);
  }
}
```

### Document Picker Integration

```typescript
import * as DocumentPicker from 'expo-document-picker';
import { uploadFileWithSessionReactNative } from '../services/storage/uploadFileWithSessionReactNative';

async function handleDocumentUpload() {
  try {
    // Pick document
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      
      // Create file object
      const file = {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || 'application/octet-stream',
        size: asset.size,
      };

      // Upload
      const uploadResult = await uploadFileWithSessionReactNative(
        file,
        `${groupId}/${userId}/${file.name}`,
        'gfiles'
      );

      if (uploadResult) {
        console.log('Document uploaded:', uploadResult.path);
      }
    }
  } catch (error) {
    console.error('Document upload error:', error);
  }
}
```

## Key Features of the New Function

### 1. Multiple Upload Methods
- **ArrayBuffer**: Preferred method, works for most files
- **FormData**: Fallback for React Native specific cases
- **Base64**: Handles data URIs

### 2. Automatic Method Selection
The function automatically tries different methods:
1. ArrayBuffer (fastest, most reliable)
2. FormData (React Native specific)
3. Base64 data URI (for data: URIs)

### 3. Enhanced Error Handling
- Detects "No content provided" errors
- Automatically switches methods on failure
- Provides detailed error analysis

### 4. Progress Tracking
```typescript
const result = await uploadFileWithSessionReactNative(
  file,
  filePath,
  bucket,
  (progress) => {
    // Progress from 0 to 100
    setUploadProgress(progress);
  }
);
```

### 5. File Validation
- Checks file size limits
- Validates path structure
- Ensures RLS policy compliance

## Testing Your Implementation

### Run the Test Scripts

```bash
# Test React Native file handling methods
node scripts/test-react-native-file-handling.js

# Test the optimized upload function
node scripts/test-react-native-optimized-upload.js
```

### Expected Results

✅ **No more "No content provided" errors**  
✅ **Proper content-length headers (actual file size)**  
✅ **Successful uploads with both ArrayBuffer and FormData**  
✅ **Progress tracking works correctly**  

## Troubleshooting

### Still Getting "No content provided"?

1. **Check file URI**: Ensure the URI is valid and accessible
2. **Verify file exists**: Make sure the file hasn't been deleted
3. **Check permissions**: Ensure your app has file access permissions
4. **Test with different file types**: Try both images and documents

### File Size Shows as 162 bytes?

This indicates the file data isn't being read properly:
1. Check if the file URI is correct
2. Verify the file actually exists at that location
3. Ensure proper permissions to read the file

### RLS Policy Errors?

1. Verify path structure: `{group_id}/{user_id}/{filename}`
2. Check user authentication
3. Ensure user ID in path matches authenticated user

## Migration Checklist

- [ ] Replace `uploadFileWithSessionFixed` calls with `uploadFileWithSessionReactNative`
- [ ] Update file parameter structure to use file object instead of just URI
- [ ] Test with different file types (images, documents, etc.)
- [ ] Verify progress tracking works
- [ ] Test error handling scenarios
- [ ] Run the provided test scripts
- [ ] Monitor upload success rates in production

## Performance Notes

- **ArrayBuffer method**: Fastest, lowest memory usage
- **FormData method**: Slightly slower but more compatible
- **Automatic fallback**: Ensures maximum compatibility

The function will automatically choose the best method for each upload, ensuring both performance and reliability.
# File Preview and Download System

This document describes the WhatsApp-style file preview and download system implemented for the Ghana Education App.

## Features

### 🔍 Automatic File Preview
- **Tap to Preview**: Users can tap on any resource to automatically open it in a preview screen
- **Multi-format Support**: Supports images, videos, PDFs, documents, and web links
- **Zoom & Pan**: Images support pinch-to-zoom and pan gestures
- **Video Playback**: Native video controls for video files
- **PDF Viewing**: In-browser PDF viewing with WebView
- **Document Info**: Shows file details for unsupported formats

### 📥 Download Management
- **One-tap Download**: Download button in preview screen header
- **Progress Tracking**: Real-time download progress with percentage
- **Smart Storage**: Automatically saves media files to device gallery
- **File Sharing**: Integration with native sharing options
- **Downloads Screen**: Dedicated screen to manage downloaded files

### 🎨 Enhanced UI/UX
- **Visual Indicators**: Preview hints on resource cards
- **File Type Icons**: Color-coded icons for different file types
- **Thumbnail Previews**: Enhanced thumbnails with preview overlays
- **WhatsApp-style Interface**: Familiar preview screen design

## Implementation Details

### Core Components

#### 1. ResourcePreviewScreen
- **Location**: `src/screens/main/ResourcePreviewScreen.tsx`
- **Purpose**: Main preview interface with download functionality
- **Features**:
  - Dynamic content rendering based on file type
  - Download progress tracking
  - Error handling and retry logic
  - Resource metadata display

#### 2. DownloadService
- **Location**: `src/services/download/downloadService.ts`
- **Purpose**: Handles file downloads and local storage
- **Features**:
  - Progress callbacks
  - Media library integration
  - File sharing capabilities
  - Storage space checking

#### 3. DownloadsScreen
- **Location**: `src/screens/main/DownloadsScreen.tsx`
- **Purpose**: Manage downloaded files
- **Features**:
  - List all downloaded files
  - File size and date information
  - Delete downloaded files
  - Open files with system apps

#### 4. FilePreviewThumbnail
- **Location**: `src/components/common/FilePreviewThumbnail.tsx`
- **Purpose**: Enhanced thumbnail component
- **Features**:
  - Color-coded file type indicators
  - Preview overlays
  - Smart icon selection

### Navigation Flow

```
ResourcesScreen
    ↓ (tap resource)
ResourcePreviewScreen
    ↓ (download button)
DownloadService
    ↓ (view downloads)
DownloadsScreen
```

### File Type Support

| Type | Preview | Download | Notes |
|------|---------|----------|-------|
| Images (JPG, PNG, GIF) | ✅ Zoom/Pan | ✅ Gallery | Full preview with gestures |
| Videos (MP4, MOV) | ✅ Native Player | ✅ Gallery | Native video controls |
| PDFs | ✅ WebView | ✅ Files | In-browser viewing |
| Documents (DOC, XLS, PPT) | ⚠️ Info Only | ✅ Files | Shows file information |
| Links/URLs | ✅ WebView | ❌ N/A | Opens in WebView |
| Other Files | ⚠️ Info Only | ✅ Files | Generic file handling |

## Usage Examples

### Basic Resource Preview
```typescript
// Navigate to preview from resource list
navigation.navigate('ResourcePreview', { resource });
```

### Download with Progress
```typescript
await DownloadService.downloadFile(
  url,
  filename,
  mimeType,
  (progress) => setDownloadProgress(progress)
);
```

### Check Downloaded Files
```typescript
const files = await DownloadService.getDownloadedFiles();
```

## Dependencies

The following packages are required:

```json
{
  "expo-av": "~15.1.4",
  "expo-file-system": "~18.1.4", 
  "expo-media-library": "~17.1.4",
  "expo-sharing": "~13.1.4",
  "react-native-webview": "13.12.2"
}
```

### Installation

Run the installation script:
```bash
node scripts/install-preview-dependencies.js
```

Or install manually:
```bash
npx expo install expo-av expo-file-system expo-media-library expo-sharing react-native-webview
```

## Permissions

The app requires the following permissions:

### iOS (app.json)
```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSPhotoLibraryUsageDescription": "This app needs access to save downloaded images and videos.",
        "NSPhotoLibraryAddUsageDescription": "This app needs access to save downloaded media files."
      }
    }
  }
}
```

### Android (app.json)
```json
{
  "expo": {
    "android": {
      "permissions": [
        "WRITE_EXTERNAL_STORAGE",
        "READ_EXTERNAL_STORAGE"
      ]
    }
  }
}
```

## Error Handling

The system includes comprehensive error handling:

- **Network Errors**: Retry functionality for failed downloads
- **Permission Errors**: Clear error messages for denied permissions
- **Storage Errors**: Storage space checking before downloads
- **File Format Errors**: Graceful fallbacks for unsupported formats

## Performance Considerations

- **Lazy Loading**: Preview content loads only when needed
- **Memory Management**: Images are properly sized and cached
- **Background Downloads**: Downloads continue in background
- **Storage Optimization**: Automatic cleanup of temporary files

## Future Enhancements

- [ ] Offline preview for downloaded files
- [ ] Batch download functionality
- [ ] Cloud storage integration
- [ ] Advanced file search and filtering
- [ ] File compression options
- [ ] Preview history tracking

## Testing

Test the implementation with:

```bash
# Run the app
npm start

# Test different file types
# 1. Upload various file formats
# 2. Test preview functionality
# 3. Test download progress
# 4. Verify downloads screen
# 5. Test file sharing
```

## Troubleshooting

### Common Issues

1. **WebView not loading PDFs**
   - Ensure react-native-webview is properly installed
   - Check network connectivity

2. **Downloads not saving to gallery**
   - Verify media library permissions
   - Check file type compatibility

3. **Preview screen crashes**
   - Check file URL validity
   - Verify file format support

### Debug Commands

```bash
# Check installed packages
npx expo install --check

# Clear cache
npx expo start --clear

# Check permissions
npx expo install expo-permissions
```
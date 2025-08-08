# Icon Display Issues - Troubleshooting Guide

## Problem
Icons (icon.png and splash-icon.png) are not showing on the installed mobile app but work fine on the web version.

## Root Causes & Solutions

### 1. Icon Size Requirements
**Issue**: Icons may not be the correct size for mobile platforms.

**Solution**:
- Ensure `icon.png` is exactly 1024x1024 pixels
- Ensure `adaptive-icon.png` is exactly 1024x1024 pixels  
- Ensure `splash-icon.png` is exactly 1024x1024 pixels
- Use PNG format with transparent background where appropriate

### 2. Android Adaptive Icon Configuration
**Issue**: Android uses adaptive icons which require specific configuration.

**Solution**: Updated `app.json` with proper Android configuration:
```json
"android": {
  "icon": "./assets/icon.png",
  "adaptiveIcon": {
    "foregroundImage": "./assets/adaptive-icon.png",
    "backgroundColor": "#1C1221"
  }
}
```

### 3. Build Cache Issues
**Issue**: Old cached builds may not include updated icons.

**Solution**:
```bash
# Clear Expo cache
expo r -c

# Clear EAS build cache
eas build --clear-cache --platform android

# Clean install dependencies
rm -rf node_modules
npm install
```

### 4. Icon File Corruption
**Issue**: Icon files may be corrupted or in wrong format.

**Solution**:
- Verify icons open correctly in image viewer
- Ensure icons are saved as PNG (not JPG with PNG extension)
- Re-export icons from original source if needed

### 5. App Configuration Issues
**Issue**: Missing or incorrect configuration in app.json.

**Solution**: Ensure these fields are properly set:
```json
{
  "expo": {
    "icon": "./assets/icon.png",
    "android": {
      "icon": "./assets/icon.png",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#1C1221"
      },
      "versionCode": 1
    },
    "ios": {
      "icon": "./assets/icon.png",
      "buildNumber": "1"
    }
  }
}
```

## Verification Steps

### 1. Run Icon Validation Script
```bash
node scripts/generate-icons.js
```

### 2. Test Build Process
```bash
# Development build
eas build --profile development --platform android

# Production build  
eas build --profile production --platform android
```

### 3. Check Build Logs
Look for icon-related warnings or errors in the EAS build logs.

### 4. Test Installation
- Install the APK on a physical device
- Check if icon appears in app drawer
- Check if splash screen shows correctly

## Platform-Specific Notes

### Android
- Uses adaptive icons on Android 8.0+ (API level 26+)
- Falls back to regular icon on older versions
- Icon should work well on different background shapes (circle, square, rounded square)

### iOS
- Automatically generates all required icon sizes from the main 1024x1024 icon
- Requires icon to be exactly 1024x1024 pixels
- Should not have transparency in corners

## Quick Fix Checklist

- [ ] Icons are 1024x1024 pixels
- [ ] Icons are PNG format
- [ ] `app.json` has correct icon paths
- [ ] Android adaptive icon is configured
- [ ] Build cache has been cleared
- [ ] Fresh build has been created
- [ ] APK has been tested on physical device

## If Issues Persist

1. Create new icon files from scratch
2. Use a different image editing tool
3. Test with a simple solid color icon to isolate the issue
4. Check Expo/EAS documentation for latest requirements
5. Consider using `expo-app-icon` plugin for automatic icon generation
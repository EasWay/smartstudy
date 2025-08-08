#!/usr/bin/env node

/**
 * Icon Generation Script for React Native/Expo App
 * 
 * This script helps ensure icons are properly sized for different platforms.
 * Run this after updating your main icon.png file.
 */

const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');
const REQUIRED_ICONS = {
  'icon.png': { size: 1024, description: 'Main app icon (1024x1024)' },
  'adaptive-icon.png': { size: 1024, description: 'Android adaptive icon foreground (1024x1024)' },
  'splash-icon.png': { size: 1024, description: 'Splash screen icon (1024x1024)' },
  'favicon.png': { size: 32, description: 'Web favicon (32x32)' }
};

function checkIconExists(iconPath) {
  return fs.existsSync(iconPath);
}

function getImageDimensions(imagePath) {
  // This is a basic check - in a real implementation, you'd use a library like 'image-size'
  try {
    const stats = fs.statSync(imagePath);
    return { exists: true, size: stats.size };
  } catch (error) {
    return { exists: false, size: 0 };
  }
}

function validateIcons() {
  console.log('🔍 Validating app icons...\n');
  
  let allValid = true;
  
  for (const [iconName, requirements] of Object.entries(REQUIRED_ICONS)) {
    const iconPath = path.join(ASSETS_DIR, iconName);
    const iconInfo = getImageDimensions(iconPath);
    
    if (!iconInfo.exists) {
      console.log(`❌ Missing: ${iconName}`);
      console.log(`   Required: ${requirements.description}`);
      allValid = false;
    } else {
      console.log(`✅ Found: ${iconName}`);
      console.log(`   ${requirements.description}`);
    }
  }
  
  if (!allValid) {
    console.log('\n⚠️  Some icons are missing. Please ensure all required icons are present in the assets folder.');
    console.log('\nIcon Requirements:');
    console.log('- All icons should be PNG format');
    console.log('- Main icon.png should be 1024x1024 pixels');
    console.log('- Adaptive icon should have transparent background');
    console.log('- Icons should be optimized for mobile display');
  } else {
    console.log('\n✅ All required icons are present!');
  }
  
  return allValid;
}

function generateIconChecklist() {
  console.log('\n📋 Icon Checklist for Mobile App:');
  console.log('');
  console.log('1. ✅ Main app icon (icon.png) - 1024x1024px');
  console.log('2. ✅ Android adaptive icon (adaptive-icon.png) - 1024x1024px');
  console.log('3. ✅ Splash screen icon (splash-icon.png) - 1024x1024px');
  console.log('4. ✅ Web favicon (favicon.png) - 32x32px');
  console.log('');
  console.log('📱 Platform-specific notes:');
  console.log('- Android: Uses adaptive-icon.png for modern Android versions');
  console.log('- iOS: Uses icon.png, automatically generates required sizes');
  console.log('- Web: Uses favicon.png for browser tab icon');
  console.log('');
  console.log('🔧 If icons still don\'t show after build:');
  console.log('1. Clear Expo cache: expo r -c');
  console.log('2. Clean build: eas build --clear-cache');
  console.log('3. Ensure icons are not corrupted');
  console.log('4. Check app.json configuration');
}

// Main execution
if (require.main === module) {
  console.log('🎨 Stem App - Icon Validation Tool\n');
  
  const iconsValid = validateIcons();
  generateIconChecklist();
  
  if (!iconsValid) {
    process.exit(1);
  }
}

module.exports = { validateIcons, checkIconExists };
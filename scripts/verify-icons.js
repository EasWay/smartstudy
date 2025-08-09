#!/usr/bin/env node

/**
 * Icon Verification Script
 * Verifies that icons are properly formatted for EAS builds
 */

const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'assets');

function verifyIconFile(iconPath, expectedName) {
  try {
    const stats = fs.statSync(iconPath);
    const buffer = fs.readFileSync(iconPath);
    
    // Check if it's a valid PNG file
    const isPNG = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
    
    console.log(`📁 ${expectedName}:`);
    console.log(`   ✅ File exists: ${fs.existsSync(iconPath)}`);
    console.log(`   ✅ File size: ${(stats.size / 1024).toFixed(2)} KB`);
    console.log(`   ✅ Valid PNG: ${isPNG}`);
    console.log(`   📍 Path: ${iconPath}`);
    console.log('');
    
    return isPNG && stats.size > 0;
  } catch (error) {
    console.log(`❌ ${expectedName}: Error reading file - ${error.message}`);
    return false;
  }
}

function main() {
  console.log('🔍 Verifying icon files for EAS build...\n');
  
  const icons = [
    { file: 'icon.png', name: 'Main App Icon' },
    { file: 'adaptive-icon.png', name: 'Android Adaptive Icon' },
    { file: 'splash-icon.png', name: 'Splash Screen Icon' },
    { file: 'favicon.png', name: 'Web Favicon' }
  ];
  
  let allValid = true;
  
  for (const icon of icons) {
    const iconPath = path.join(ASSETS_DIR, icon.file);
    const isValid = verifyIconFile(iconPath, icon.name);
    if (!isValid) allValid = false;
  }
  
  console.log('📋 EAS Build Recommendations:');
  console.log('');
  console.log('1. Clear EAS build cache:');
  console.log('   eas build --clear-cache --platform android');
  console.log('');
  console.log('2. Build with preview profile:');
  console.log('   eas build --profile preview --platform android');
  console.log('');
  console.log('3. If icons still don\'t show, try production build:');
  console.log('   eas build --profile production --platform android');
  console.log('');
  
  if (allValid) {
    console.log('✅ All icons are valid and ready for EAS build!');
  } else {
    console.log('❌ Some icons have issues. Please fix them before building.');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
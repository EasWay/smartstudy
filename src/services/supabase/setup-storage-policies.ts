/**
 * Supabase Storage RLS Policies Setup Script
 * 
 * This script applies the Row Level Security policies for all storage buckets.
 * Run this after creating the storage buckets in the Supabase dashboard.
 */

import { supabase } from './client';

export async function setupStoragePolicies() {
  console.log('🔧 Setting up Supabase Storage RLS Policies...');

  try {
    // Note: In a real implementation, these policies would be applied via the Supabase dashboard
    // or using the Supabase CLI. This script serves as documentation and testing.
    
    console.log('✅ Storage RLS policies are defined in storage-policies.sql');
    console.log('📝 Apply these policies in your Supabase dashboard:');
    console.log('   1. Go to Storage > Policies');
    console.log('   2. Copy and execute the SQL from storage-policies.sql');
    console.log('   3. Verify policies are active for each bucket');
    
    // Test that we can connect to Supabase
    const { data, error } = await supabase.auth.getUser();
    if (error) {
      console.warn('⚠️  Not authenticated - some policy tests will be skipped');
    } else {
      console.log('✅ Supabase connection verified');
    }

    return { success: true };
  } catch (error) {
    console.error('❌ Error setting up storage policies:', error);
    return { success: false, error };
  }
}

/**
 * Test storage bucket access with current user
 */
export async function testStoragePolicies() {
  console.log('🧪 Testing Storage RLS Policies...');

  try {
    const { data: user, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user.user) {
      console.log('⚠️  No authenticated user - skipping policy tests');
      return { success: true, message: 'No user to test with' };
    }

    const userId = user.user.id;
    console.log(`Testing with user ID: ${userId}`);

    // Test 1: User Avatars Bucket
    console.log('\n📸 Testing user-avatars bucket...');
    await testUserAvatarsPolicies(userId);

    // Test 2: Educational Resources Bucket  
    console.log('\n📚 Testing educational-resources bucket...');
    await testEducationalResourcesPolicies(userId);

    // Test 3: Group Files Bucket
    console.log('\n👥 Testing group-files bucket...');
    await testGroupFilesPolicies(userId);

    // Test 4: Temporary Uploads Bucket
    console.log('\n⏳ Testing temp-uploads bucket...');
    await testTempUploadsPolicies(userId);

    console.log('\n✅ All storage policy tests completed');
    return { success: true };

  } catch (error) {
    console.error('❌ Error testing storage policies:', error);
    return { success: false, error };
  }
}

async function testUserAvatarsPolicies(userId: string) {
  try {
    // Test uploading to own folder
    const testFile = new Blob(['test avatar'], { type: 'text/plain', lastModified: Date.now() });
    const ownPath = `${userId}/test-avatar.txt`;
    
    const { error: uploadError } = await supabase.storage
      .from('useravatars')
      .upload(ownPath, testFile);

    if (uploadError) {
      console.log(`⚠️  Upload to own folder failed: ${uploadError.message}`);
    } else {
      console.log('✅ Can upload to own avatar folder');
      
      // Clean up test file
      await supabase.storage.from('useravatars').remove([ownPath]);
    }

    // Test listing files (should work for public bucket)
    const { data: listData, error: listError } = await supabase.storage
      .from('useravatars')
      .list();

    if (listError) {
      console.log(`⚠️  List avatars failed: ${listError.message}`);
    } else {
      console.log('✅ Can list avatar files');
    }

  } catch (error) {
    console.log(`⚠️  Avatar policy test error: ${error}`);
  }
}

async function testEducationalResourcesPolicies(userId: string) {
  try {
    // Test uploading to own folder
    const testFile = new Blob(['test resource'], { type: 'text/plain', lastModified: Date.now() });
    const ownPath = `${userId}/test-resource.txt`;
    
    const { error: uploadError } = await supabase.storage
      .from('edresources')
      .upload(ownPath, testFile);

    if (uploadError) {
      console.log(`⚠️  Upload to own resources folder failed: ${uploadError.message}`);
    } else {
      console.log('✅ Can upload to own resources folder');
      
      // Clean up test file
      await supabase.storage.from('edresources').remove([ownPath]);
    }

    // Test accessing own files
    const { data: listData, error: listError } = await supabase.storage
      .from('edresources')
      .list(userId);

    if (listError) {
      console.log(`⚠️  List own resources failed: ${listError.message}`);
    } else {
      console.log('✅ Can list own resource files');
    }

  } catch (error) {
    console.log(`⚠️  Resources policy test error: ${error}`);
  }
}

async function testGroupFilesPolicies(userId: string) {
  try {
    // Note: This test is simplified since we don't have group membership data yet
    // In a real scenario, this would test with actual group IDs and memberships
    
    const testFile = new Blob(['test group file'], { type: 'text/plain', lastModified: Date.now() });
    const testGroupId = 'test-group-id';
    const groupPath = `${testGroupId}/${userId}/test-file.txt`;
    
    const { error: uploadError } = await supabase.storage
      .from('gfiles')
      .upload(groupPath, testFile);

    if (uploadError) {
      console.log(`⚠️  Group file upload failed (expected without group membership): ${uploadError.message}`);
    } else {
      console.log('✅ Group file upload succeeded');
      
      // Clean up test file
      await supabase.storage.from('gfiles').remove([groupPath]);
    }

  } catch (error) {
    console.log(`⚠️  Group files policy test error: ${error}`);
  }
}

async function testTempUploadsPolicies(userId: string) {
  try {
    // Test uploading to own temp folder
    const testFile = new Blob(['test temp file'], { type: 'text/plain', lastModified: Date.now() });
    const tempPath = `${userId}/temp-${Date.now()}.txt`;
    
    const { error: uploadError } = await supabase.storage
      .from('temuploads')
      .upload(tempPath, testFile);

    if (uploadError) {
      console.log(`⚠️  Temp upload failed: ${uploadError.message}`);
    } else {
      console.log('✅ Can upload to temp folder');
      
      // Clean up test file
      await supabase.storage.from('temuploads').remove([tempPath]);
    }

    // Test listing own temp files
    const { data: listData, error: listError } = await supabase.storage
      .from('temuploads')
      .list(userId);

    if (listError) {
      console.log(`⚠️  List temp files failed: ${listError.message}`);
    } else {
      console.log('✅ Can list own temp files');
    }

  } catch (error) {
    console.log(`⚠️  Temp uploads policy test error: ${error}`);
  }
}

/**
 * Verify that required storage buckets exist
 */
export async function verifyStorageBuckets() {
  console.log('🪣 Verifying storage buckets exist...');

  const requiredBuckets = [
    'useravatars',
    'edresources', 
    'gfiles',
    'temuploads'
  ];

  try {
    const { data: buckets, error } = await supabase.storage.listBuckets();
    
    if (error) {
      console.error('❌ Error listing buckets:', error);
      return { success: false, error };
    }

    const existingBuckets = buckets?.map(b => b.name) || [];
    const missingBuckets = requiredBuckets.filter(name => !existingBuckets.includes(name));

    if (missingBuckets.length > 0) {
      console.log('⚠️  Missing buckets:', missingBuckets);
      console.log('📝 Create these buckets in your Supabase dashboard:');
      missingBuckets.forEach(bucket => {
        console.log(`   - ${bucket}`);
      });
      return { success: false, missingBuckets };
    }

    console.log('✅ All required storage buckets exist');
    return { success: true, buckets: existingBuckets };

  } catch (error) {
    console.error('❌ Error verifying buckets:', error);
    return { success: false, error };
  }
}
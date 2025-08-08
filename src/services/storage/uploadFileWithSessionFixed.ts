import { supabase } from '../supabase/client';
import { fixInvalidPath, pathNeedsFix } from './pathUtils';
import { decode } from 'base64-arraybuffer';

/**
 * Fixed version of uploadFileWithSession with React Native specific improvements
 * This version addresses the "Network request failed" issue
 */
export async function uploadFileWithSessionFixed(
  fileUri: string,
  filePath: string,
  bucket: string,
  onProgress?: (progress: number) => void
): Promise<{ path: string; publicUrl?: string } | null> {
  try {
    // Validate inputs
    if (!fileUri || !filePath || !bucket) {
      console.error('Invalid upload parameters:', { fileUri, filePath, bucket });
      return null;
    }

    console.log('🚀 Starting file upload with fixed implementation:', {
      bucket,
      filePath,
      fileUri: fileUri.substring(0, 50) + '...'
    });

    // Check authentication first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ Authentication error:', authError);
      return null;
    }

    console.log('✅ User authenticated:', user.id);
    if (onProgress) onProgress(10);

    // React Native specific file handling - use ArrayBuffer for Supabase compatibility
    let fileData: ArrayBuffer;
    let contentType: string = 'application/octet-stream';

    try {
      console.log('📁 Processing file URI for React Native...');
      console.log('Fetching file from URI:', fileUri);

      // Determine content type from file extension
      const lowerUri = fileUri.toLowerCase();
      if (lowerUri.includes('.jpg') || lowerUri.includes('.jpeg')) {
        contentType = 'image/jpeg';
      } else if (lowerUri.includes('.png')) {
        contentType = 'image/png';
      } else if (lowerUri.includes('.gif')) {
        contentType = 'image/gif';
      } else if (lowerUri.includes('.webp')) {
        contentType = 'image/webp';
      } else if (lowerUri.includes('.pdf')) {
        contentType = 'application/pdf';
      }

      // Method 1: Direct ArrayBuffer fetch (preferred for React Native)
      console.log('Starting ArrayBuffer fetch request...');
      const response = await fetch(fileUri, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
      }

      console.log('Fetch completed with status:', response.status);
      fileData = await response.arrayBuffer();

      console.log('✅ File ArrayBuffer created:', {
        size: fileData.byteLength,
        contentType: contentType
      });

    } catch (fetchError: any) {
      console.error('❌ ArrayBuffer fetch failed:', fetchError.message);

      // Method 2: Try base64 conversion approach
      try {
        console.log('🔄 Trying base64 conversion method...');

        // For React Native, sometimes we need to handle base64 data
        if (fileUri.startsWith('data:')) {
          // Handle data URI
          const base64Data = fileUri.split(',')[1];
          if (!base64Data) {
            throw new Error('Invalid data URI format');
          }

          fileData = decode(base64Data);
          console.log('✅ File loaded from data URI:', {
            size: fileData.byteLength,
            contentType: contentType
          });
        } else {
          // Try alternative fetch approach
          const altResponse = await fetch(fileUri);
          if (!altResponse.ok) {
            throw new Error(`Alternative fetch failed: ${altResponse.status}`);
          }

          fileData = await altResponse.arrayBuffer();
          console.log('✅ File loaded via alternative ArrayBuffer method:', {
            size: fileData.byteLength,
            contentType: contentType
          });
        }

      } catch (altError: any) {
        console.error('❌ All file loading methods failed:', altError.message);
        return null;
      }
    }

    // Validate file data
    if (!fileData || fileData.byteLength === 0) {
      console.error('❌ Invalid file data: empty or null ArrayBuffer');
      return null;
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (fileData.byteLength > maxSize) {
      console.error('❌ File too large:', { size: fileData.byteLength, maxSize });
      return null;
    }

    if (onProgress) onProgress(30);

    // Check if path needs fixing for InvalidKey errors
    let finalPath = filePath;

    if (pathNeedsFix(filePath)) {
      console.warn('⚠️ Path contains invalid characters, fixing...', filePath);

      try {
        finalPath = fixInvalidPath(filePath);
        console.log('✅ Path fixed:', {
          original: filePath,
          fixed: finalPath
        });
      } catch (fixError: any) {
        console.error('❌ Could not fix invalid path:', fixError.message);
        console.error('Original path:', filePath);
        return null;
      }
    }

    // Parse and verify path structure for RLS policy
    const pathParts = finalPath.split('/');
    if (pathParts.length !== 3) {
      console.error('❌ Invalid path structure for gfiles bucket:', finalPath);
      console.error('Expected exactly 3 segments: groupId/userId/filename');
      console.error('Got', pathParts.length, 'segments:', pathParts);
      return null;
    }

    const [groupId, userIdInPath, filename] = pathParts;

    // Verify user ID matches (check both original and sanitized versions)
    const originalUserId = filePath.split('/')[1]; // Get original user ID
    if (originalUserId !== user.id) {
      console.error('❌ User ID mismatch in original path:', {
        originalPathUserId: originalUserId,
        authenticatedUserId: user.id
      });
      return null;
    }

    console.log('✅ Path structure validated and sanitized:', {
      groupId,
      userId: userIdInPath,
      filename,
      fullPath: finalPath,
      wasFixed: finalPath !== filePath,
      matches: originalUserId === user.id
    });

    // Update filePath to use the fixed version
    filePath = finalPath;

    if (onProgress) onProgress(40);

    // Upload with enhanced error handling and network resilience
    let uploadResult: any = null;
    let lastError: any = null;
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`Upload attempt ${attempt}/${maxAttempts}`);
        console.log('Starting upload attempt', attempt + '...');

        // Log upload parameters for debugging
        console.log('Upload parameters:', {
          arrayBufferSize: fileData.byteLength,
          contentType: contentType,
          bucket,
          filePath
        });

        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(filePath, fileData, {
            cacheControl: '3600',
            upsert: false,
            contentType: contentType,
          });

        if (error) {
          lastError = error;
          console.error(`Upload attempt ${attempt} failed:`, {
            message: error.message,
            name: error.name,
            cause: error.cause
          });

          // Specific error analysis
          if (error.message?.includes('row-level security policy')) {
            console.error('🔒 RLS Policy violation detected:');
            console.error('   - Check if user is properly authenticated');
            console.error('   - Verify path structure matches policy');
            console.error('   - Ensure user ID in path matches authenticated user');
            break; // Don't retry RLS errors
          }

          // Check for network-related errors
          if (error.message?.includes('Network request failed') ||
            error.message?.includes('fetch') ||
            error.name === 'StorageUnknownError') {
            console.error('🌐 Network error detected - will retry with backoff');
          }

          // Wait before retry (exponential backoff)
          if (attempt < maxAttempts) {
            const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
            console.log(`⏳ Waiting ${delay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }

          continue;
        }

        // Success!
        uploadResult = data;
        console.log('✅ Upload successful:', {
          path: data.path,
          id: data.id
        });
        break;

      } catch (uploadError: any) {
        lastError = uploadError;
        console.error(`Upload attempt ${attempt} threw error:`, {
          message: uploadError.message,
          name: uploadError.name,
          stack: uploadError.stack?.split('\n').slice(0, 2).join('\n')
        });

        // Network-specific error handling
        if (uploadError.message?.includes('Network request failed') ||
          uploadError.message?.includes('fetch') ||
          uploadError.name === 'TypeError') {
          console.error('🌐 Network connectivity issue detected');

          if (attempt < maxAttempts) {
            const delay = Math.min(2000 * Math.pow(2, attempt - 1), 10000);
            console.log(`⏳ Network retry in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }

        if (attempt === maxAttempts) {
          break;
        }
      }

      if (onProgress) onProgress(40 + (attempt * 15));
    }

    if (!uploadResult) {
      console.error('❌ All upload attempts failed. Last error:', lastError);
      return null;
    }

    if (onProgress) onProgress(90);

    // Get public URL
    let publicUrl: string | undefined;
    try {
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);

      publicUrl = publicUrlData.publicUrl;

      if (!publicUrl || !publicUrl.startsWith('http')) {
        console.warn('⚠️  Invalid public URL generated:', publicUrl);
        publicUrl = undefined;
      }
    } catch (urlError: any) {
      console.error('❌ Error generating public URL:', urlError.message);
      publicUrl = undefined;
    }

    if (onProgress) onProgress(100);

    const result = {
      path: uploadResult.path,
      publicUrl,
    };

    console.log('🎉 Upload completed successfully:', {
      path: result.path,
      hasPublicUrl: !!result.publicUrl
    });

    return result;

  } catch (error: any) {
    console.error('❌ Upload function error:', {
      message: error.message,
      name: error.name,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    });
    return null;
  }
}
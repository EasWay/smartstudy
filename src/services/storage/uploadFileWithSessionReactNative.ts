import { supabase } from '../supabase/client';
import { fixInvalidPath, pathNeedsFix } from './pathUtils';
import { decode } from 'base64-arraybuffer';

/**
 * React Native optimized file upload for Supabase Storage
 * Specifically addresses the "No content provided" error by using proper file handling
 */
export async function uploadFileWithSessionReactNative(
  file: {
    uri: string;
    name: string;
    type: string;
    size?: number;
  },
  filePath: string,
  bucket: string,
  onProgress?: (progress: number) => void
): Promise<{ path: string; publicUrl?: string } | null> {
  try {
    // Validate inputs
    if (!file?.uri || !file?.name || !filePath || !bucket) {
      console.error('Invalid upload parameters:', { file, filePath, bucket });
      return null;
    }

    console.log('🚀 Starting React Native file upload:', {
      bucket,
      filePath,
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      fileUri: file.uri.substring(0, 50) + '...'
    });

    // Check authentication first
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('❌ Authentication error:', authError);
      return null;
    }

    console.log('✅ User authenticated:', user.id);
    if (onProgress) onProgress(10);

    // React Native specific file handling with multiple fallback methods
    let fileData: ArrayBuffer | FormData;
    let contentType: string = file.type || 'application/octet-stream';
    let uploadMethod: 'ArrayBuffer' | 'FormData' = 'ArrayBuffer';

    try {
      console.log('📁 Processing React Native file...');
      
      // Method 1: Try ArrayBuffer approach (preferred for most cases)
      console.log('Attempting ArrayBuffer method...');
      
      const response = await fetch(file.uri, {
        method: 'GET',
        headers: {
          'Accept': '*/*',
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        throw new Error(`Fetch failed: ${response.status} ${response.statusText}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      
      // Validate ArrayBuffer has content
      if (!arrayBuffer || arrayBuffer.byteLength === 0) {
        throw new Error('ArrayBuffer is empty');
      }

      // Check if size matches expected (if provided)
      if (file.size && arrayBuffer.byteLength !== file.size) {
        console.warn('⚠️ File size mismatch:', {
          expected: file.size,
          actual: arrayBuffer.byteLength
        });
      }

      fileData = arrayBuffer;
      uploadMethod = 'ArrayBuffer';
      
      console.log('✅ ArrayBuffer method successful:', {
        size: arrayBuffer.byteLength,
        contentType: contentType
      });

    } catch (arrayBufferError: any) {
      console.warn('⚠️ ArrayBuffer method failed:', arrayBufferError.message);
      
      try {
        // Method 2: Try FormData approach (React Native specific)
        console.log('🔄 Attempting FormData method...');
        
        const formData = new FormData();
        
        // React Native expects this specific structure
        formData.append('file', {
          uri: file.uri,
          name: file.name,
          type: file.type,
        } as any);

        fileData = formData;
        uploadMethod = 'FormData';
        
        console.log('✅ FormData method successful');

      } catch (formDataError: any) {
        console.error('❌ FormData method also failed:', formDataError.message);
        
        try {
          // Method 3: Try base64 data URI approach
          console.log('🔄 Attempting base64 data URI method...');
          
          if (file.uri.startsWith('data:')) {
            const base64Data = file.uri.split(',')[1];
            if (!base64Data) {
              throw new Error('Invalid data URI format');
            }
            
            const arrayBuffer = decode(base64Data);
            if (!arrayBuffer || arrayBuffer.byteLength === 0) {
              throw new Error('Base64 decode resulted in empty buffer');
            }
            
            fileData = arrayBuffer;
            uploadMethod = 'ArrayBuffer';
            
            console.log('✅ Base64 data URI method successful:', {
              size: arrayBuffer.byteLength
            });
          } else {
            throw new Error('Not a data URI');
          }

        } catch (base64Error: any) {
          console.error('❌ All file loading methods failed:', base64Error.message);
          return null;
        }
      }
    }

    if (onProgress) onProgress(30);

    // Validate file data based on method
    if (uploadMethod === 'ArrayBuffer') {
      const buffer = fileData as ArrayBuffer;
      if (!buffer || buffer.byteLength === 0) {
        console.error('❌ Invalid ArrayBuffer: empty or null');
        return null;
      }

      // Check file size (10MB limit)
      const maxSize = 10 * 1024 * 1024;
      if (buffer.byteLength > maxSize) {
        console.error('❌ File too large:', { size: buffer.byteLength, maxSize });
        return null;
      }
    }

    // Path validation and fixing
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
        return null;
      }
    }

    // Validate path structure based on bucket type
    const pathParts = finalPath.split('/');
    
    if (bucket === 'gfiles') {
      // gfiles bucket expects: groupId/userId/filename
      if (pathParts.length !== 3) {
        console.error('❌ Invalid path structure for gfiles bucket:', finalPath);
        console.error('Expected exactly 3 segments: groupId/userId/filename');
        return null;
      }

      const [groupId, userIdInPath, filename] = pathParts;
      
      // Verify user ID matches
      const originalUserId = filePath.split('/')[1];
      if (originalUserId !== user.id) {
        console.error('❌ User ID mismatch:', {
          pathUserId: originalUserId,
          authenticatedUserId: user.id
        });
        return null;
      }

      console.log('✅ gfiles path validation successful:', {
        groupId,
        userId: userIdInPath,
        filename,
        fullPath: finalPath,
        uploadMethod
      });
    } else if (bucket === 'edresources') {
      // edresources bucket expects: userId/filename or userId/subfolder/filename
      if (pathParts.length < 2) {
        console.error('❌ Invalid path structure for edresources bucket:', finalPath);
        console.error('Expected at least 2 segments: userId/filename');
        return null;
      }

      const userIdInPath = pathParts[0];
      const filename = pathParts[pathParts.length - 1];
      
      // Verify user ID matches
      if (userIdInPath !== user.id) {
        console.error('❌ User ID mismatch:', {
          pathUserId: userIdInPath,
          authenticatedUserId: user.id
        });
        return null;
      }

      console.log('✅ edresources path validation successful:', {
        userId: userIdInPath,
        filename,
        fullPath: finalPath,
        uploadMethod
      });
    } else {
      // For other buckets, just log the path
      console.log('✅ Path validation for bucket:', {
        bucket,
        fullPath: finalPath,
        uploadMethod
      });
    }

    if (onProgress) onProgress(50);

    // Upload with retry logic
    let uploadResult: any = null;
    let lastError: any = null;
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        console.log(`Upload attempt ${attempt}/${maxAttempts} using ${uploadMethod}`);
        
        // Prepare upload options
        const uploadOptions: any = {
          cacheControl: '3600',
          upsert: false,
        };

        // Only set contentType for ArrayBuffer uploads
        if (uploadMethod === 'ArrayBuffer') {
          uploadOptions.contentType = contentType;
          
          console.log('Upload parameters:', {
            method: uploadMethod,
            arrayBufferSize: (fileData as ArrayBuffer).byteLength,
            contentType: contentType,
            bucket,
            filePath: finalPath
          });
        } else {
          console.log('Upload parameters:', {
            method: uploadMethod,
            bucket,
            filePath: finalPath,
            formDataKeys: 'file'
          });
        }

        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(finalPath, fileData, uploadOptions);

        if (error) {
          lastError = error;
          console.error(`Upload attempt ${attempt} failed:`, {
            message: error.message,
            name: error.name
          });

          // Analyze specific errors
          if (error.message?.includes('No content provided')) {
            console.error('🚨 "No content provided" error detected!');
            console.error('   This suggests the file data is not reaching Supabase');
            console.error('   Current method:', uploadMethod);
            
            // If ArrayBuffer failed with "No content provided", try FormData on next attempt
            if (uploadMethod === 'ArrayBuffer' && attempt < maxAttempts) {
              console.log('🔄 Switching to FormData method for next attempt...');
              try {
                const formData = new FormData();
                formData.append('file', {
                  uri: file.uri,
                  name: file.name,
                  type: file.type,
                } as any);
                fileData = formData;
                uploadMethod = 'FormData';
              } catch (switchError) {
                console.error('Failed to switch to FormData:', switchError);
              }
            }
          }

          if (error.message?.includes('row-level security policy')) {
            console.error('🔒 RLS Policy violation - not retrying');
            break;
          }

          // Wait before retry
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
          id: data.id,
          method: uploadMethod
        });
        break;

      } catch (uploadError: any) {
        lastError = uploadError;
        console.error(`Upload attempt ${attempt} threw error:`, {
          message: uploadError.message,
          name: uploadError.name
        });

        if (attempt === maxAttempts) {
          break;
        }
      }

      if (onProgress) onProgress(50 + (attempt * 15));
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
        .getPublicUrl(finalPath);
      
      publicUrl = publicUrlData.publicUrl;
      
      if (!publicUrl || !publicUrl.startsWith('http')) {
        console.warn('⚠️ Invalid public URL generated:', publicUrl);
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

    console.log('🎉 React Native upload completed successfully:', {
      path: result.path,
      hasPublicUrl: !!result.publicUrl,
      method: uploadMethod
    });

    return result;

  } catch (error: any) {
    console.error('❌ React Native upload function error:', {
      message: error.message,
      name: error.name,
      stack: error.stack?.split('\n').slice(0, 3).join('\n')
    });
    return null;
  }
}
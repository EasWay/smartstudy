import { supabase } from '../supabase/client';

/**
 * Upload file with session handling and improved error handling
 * Enhanced version with better network resilience and debugging
 */
export async function uploadFileWithSession(
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

    console.log('Starting file upload:', { 
      bucket, 
      filePath, 
      fileUri: fileUri.substring(0, 50) + '...' // Truncate for privacy
    });

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return null;
    }

    console.log('User authenticated:', user.id);

    // Progress update: Authentication complete
    if (onProgress) onProgress(10);

    // Convert file URI to blob for upload with React Native specific handling
    let response: Response;
    let blob: Blob;
    
    try {
      console.log('Fetching file from URI:', fileUri.substring(0, 50) + '...');
      
      // React Native specific: Handle different URI schemes
      let fetchUri = fileUri;
      
      // Handle React Native file URIs
      if (fileUri.startsWith('file://')) {
        // For React Native, we might need to handle file:// URIs differently
        fetchUri = fileUri;
      } else if (fileUri.startsWith('content://')) {
        // Android content URIs
        fetchUri = fileUri;
      } else if (fileUri.startsWith('ph://')) {
        // iOS photo library URIs
        fetchUri = fileUri;
      }
      
      // Add timeout to fetch request with React Native considerations
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.log('Fetch timeout triggered after 30 seconds');
        controller.abort();
      }, 30000); // 30 second timeout
      
      console.log('Starting fetch request...');
      response = await fetch(fetchUri, { 
        signal: controller.signal,
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Accept': '*/*',
        }
      });
      
      clearTimeout(timeoutId);
      console.log('Fetch completed with status:', response.status);
      
      if (!response.ok) {
        console.error('Failed to fetch file:', {
          status: response.status,
          statusText: response.statusText,
          url: response.url,
          headers: Object.fromEntries(response.headers.entries())
        });
        return null;
      }
    } catch (fetchError: any) {
      console.error('File fetch error:', {
        message: fetchError.message,
        name: fetchError.name,
        code: fetchError.code,
        fileUri: fileUri.substring(0, 50) + '...',
        stack: fetchError.stack?.split('\n').slice(0, 2).join('\n')
      });
      
      // Specific error handling for React Native
      if (fetchError.name === 'AbortError') {
        console.error('Fetch was aborted due to timeout');
      } else if (fetchError.message.includes('Network request failed')) {
        console.error('Network request failed - this could be due to:');
        console.error('1. File URI is invalid or inaccessible');
        console.error('2. Network connectivity issues');
        console.error('3. File permissions in React Native');
        console.error('4. File has been moved or deleted');
      }
      
      return null;
    }

    // Progress update: File fetched
    if (onProgress) onProgress(25);
    
    try {
      blob = await response.blob();
      console.log('File blob created:', { size: blob.size, type: blob.type });
    } catch (blobError: any) {
      console.error('Blob creation error:', blobError.message);
      return null;
    }

    // Validate blob
    if (!blob || blob.size === 0) {
      console.error('Invalid blob created from file URI');
      return null;
    }

    // Check blob size limit (10MB for most cases)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (blob.size > maxSize) {
      console.error('File too large:', { size: blob.size, maxSize });
      return null;
    }

    // Progress update: Blob ready
    if (onProgress) onProgress(40);

    // Upload directly to Supabase with enhanced retry logic
    let uploadAttempts = 0;
    const maxAttempts = 3;
    let uploadError: any = null;
    let uploadData: any = null;

    while (uploadAttempts < maxAttempts) {
      uploadAttempts++;
      console.log(`Upload attempt ${uploadAttempts}/${maxAttempts}`);

      try {
        console.log(`Starting upload attempt ${uploadAttempts}...`);
        console.log('Upload parameters:', {
          bucket,
          filePath,
          blobSize: blob.size,
          blobType: blob.type
        });
        
        // Add timeout to upload request
        const uploadPromise = supabase.storage
          .from(bucket)
          .upload(filePath, blob, {
            cacheControl: '3600',
            upsert: false,
            duplex: 'half', // Required for some environments
          });

        // Race against timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => {
            console.log('Upload timeout triggered after 60 seconds');
            reject(new Error('Upload timeout'));
          }, 60000) // 60 second timeout
        );

        const { data, error } = await Promise.race([uploadPromise, timeoutPromise]) as any;

        if (!error && data) {
          uploadData = data;
          uploadError = null;
          console.log(`Upload attempt ${uploadAttempts} successful:`, {
            path: data.path,
            id: data.id
          });
          break;
        }

        uploadError = error || new Error('Unknown upload error');
        console.error(`Upload attempt ${uploadAttempts} failed:`, {
          message: uploadError.message,
          statusCode: uploadError.statusCode,
          error: uploadError.error,
          name: uploadError.name,
          details: uploadError.details || 'No additional details'
        });

        // Specific error analysis
        if (uploadError.message?.includes('row-level security policy')) {
          console.error('RLS Policy Error Analysis:');
          console.error('- User authenticated:', !!user);
          console.error('- User ID:', user.id);
          console.error('- File path:', filePath);
          console.error('- Expected user ID in path position [2]:', filePath.split('/')[1]);
          console.error('- Path matches user ID:', filePath.split('/')[1] === user.id);
        } else if (uploadError.message?.includes('Network request failed')) {
          console.error('Network Error Analysis:');
          console.error('- This might be a connectivity issue');
          console.error('- Check internet connection');
          console.error('- Verify Supabase endpoint accessibility');
        }

      } catch (attemptError: any) {
        uploadError = attemptError;
        console.error(`Upload attempt ${uploadAttempts} threw error:`, {
          message: attemptError.message,
          name: attemptError.name,
          code: attemptError.code,
          stack: attemptError.stack?.split('\n').slice(0, 3).join('\n')
        });
      }
      
      // Progress update during retries
      if (onProgress) onProgress(40 + (uploadAttempts * 15));
      
      // Wait before retry with exponential backoff
      if (uploadAttempts < maxAttempts) {
        const delay = Math.min(1000 * Math.pow(2, uploadAttempts - 1), 5000); // Max 5 second delay
        console.log(`Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    if (uploadError) {
      console.error('All upload attempts failed:', uploadError);
      console.error('Upload details:', { 
        blobSize: blob.size, 
        bucket, 
        filePath, 
        userId: user.id 
      });
      return null;
    }

    // Progress update: Upload complete
    if (onProgress) onProgress(90);

    // Get public URL with error handling
    let publicUrl: string | undefined;
    try {
      const { data: publicUrlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(filePath);
      
      publicUrl = publicUrlData.publicUrl;
      
      // Validate public URL
      if (!publicUrl || !publicUrl.startsWith('http')) {
        console.warn('Invalid public URL generated:', publicUrl);
        publicUrl = undefined;
      }
    } catch (urlError: any) {
      console.error('Error generating public URL:', urlError.message);
      publicUrl = undefined;
    }

    // Final progress update
    if (onProgress) onProgress(100);

    const result = {
      path: uploadData.path,
      publicUrl,
    };

    console.log('Upload successful:', { 
      path: result.path, 
      hasPublicUrl: !!result.publicUrl 
    });

    return result;

  } catch (error: any) {
    console.error('Error in uploadFileWithSession:', {
      message: error.message,
      name: error.name,
      stack: error.stack?.split('\n').slice(0, 3).join('\n'), // First 3 lines of stack
    });
    return null;
  }
}
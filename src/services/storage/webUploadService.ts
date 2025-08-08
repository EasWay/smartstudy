import { Platform } from 'react-native';
import { supabase } from '../supabase/client';

/**
 * Web-optimized file upload service
 */
export async function uploadFileWeb(
  file: File | Blob,
  filePath: string,
  bucket: string,
  onProgress?: (progress: number) => void
): Promise<{ path: string; publicUrl?: string } | null> {
  if (Platform.OS !== 'web') {
    throw new Error('uploadFileWeb is only available on web platform');
  }

  try {
    console.log('Starting web file upload:', { 
      bucket, 
      filePath, 
      fileSize: file.size,
      fileType: file.type
    });

    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error('Authentication error:', authError);
      return null;
    }

    if (onProgress) onProgress(10);

    // Validate file
    if (!file || file.size === 0) {
      console.error('Invalid file provided');
      return null;
    }

    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      console.error('File too large:', { size: file.size, maxSize });
      return null;
    }

    if (onProgress) onProgress(25);

    // Upload with retry logic
    let uploadAttempts = 0;
    const maxAttempts = 3;
    let uploadError: any = null;
    let uploadData: any = null;

    while (uploadAttempts < maxAttempts) {
      uploadAttempts++;
      console.log(`Web upload attempt ${uploadAttempts}/${maxAttempts}`);

      try {
        const { data, error } = await supabase.storage
          .from(bucket)
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (!error && data) {
          uploadData = data;
          uploadError = null;
          console.log('Web upload successful:', data);
          break;
        }

        uploadError = error;
        console.error(`Web upload attempt ${uploadAttempts} failed:`, error);

      } catch (attemptError: any) {
        uploadError = attemptError;
        console.error(`Web upload attempt ${uploadAttempts} threw error:`, attemptError);
      }

      if (onProgress) onProgress(25 + (uploadAttempts * 20));

      // Wait before retry
      if (uploadAttempts < maxAttempts) {
        const delay = Math.min(1000 * Math.pow(2, uploadAttempts - 1), 5000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    if (uploadError) {
      console.error('All web upload attempts failed:', uploadError);
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
    } catch (urlError: any) {
      console.error('Error generating public URL:', urlError);
      publicUrl = undefined;
    }

    if (onProgress) onProgress(100);

    return {
      path: uploadData.path,
      publicUrl,
    };

  } catch (error: any) {
    console.error('Error in uploadFileWeb:', error);
    return null;
  }
}

/**
 * Convert File input to upload format
 */
export function handleWebFileInput(
  event: Event,
  callback: (file: File) => void
): void {
  const input = event.target as HTMLInputElement;
  const file = input.files?.[0];
  
  if (file) {
    callback(file);
  }
}

/**
 * Create file input element for web
 */
export function createWebFileInput(
  accept: string = '*/*',
  multiple: boolean = false
): HTMLInputElement {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = accept;
  input.multiple = multiple;
  input.style.display = 'none';
  
  return input;
}

/**
 * Trigger file picker on web
 */
export function triggerWebFilePicker(
  accept: string = '*/*',
  multiple: boolean = false
): Promise<File[]> {
  return new Promise((resolve, reject) => {
    const input = createWebFileInput(accept, multiple);
    
    input.onchange = (event) => {
      const files = Array.from(input.files || []);
      document.body.removeChild(input);
      resolve(files);
    };
    
    input.oncancel = () => {
      document.body.removeChild(input);
      resolve([]);
    };
    
    document.body.appendChild(input);
    input.click();
  });
}
import { supabase } from '../supabase/client';
import { ImageService } from '../image/ImageService';

interface StorageConfig {
  bucket: string;
  maxFileSize: number;
  allowedTypes: string[];
  generateThumbnail: boolean;
  isPublic: boolean;
}

class StorageService {
  static async uploadFile(
    file: File | Blob | ArrayBuffer, // Added ArrayBuffer as an accepted type
    path: string,
    config: StorageConfig,
    onProgress?: (progress: number) => void
  ): Promise<{ url: string; path: string; error?: Error }> {
    try {
      let fileToUpload = file;
      // File validation - safely check if file is an object first
      if (config.generateThumbnail && file && typeof file === 'object' && 'type' in file && file.type.startsWith('image/')) {
        let imageUri: string | undefined;

        if ('uri' in file && typeof file.uri === 'string') {
          imageUri = file.uri;
        } else if (file instanceof Blob) {
          // If it's a Blob, we might need to create a temporary URL for ImageManipulator
          // This is a simplified approach; a more robust solution might involve
          // writing the Blob to a temporary file and getting its URI.
          // For now, we'll assume ImageManipulator can handle a Blob directly if it has a URI.
          // If not, this path will effectively skip processing for Blobs without URIs.
          console.warn('Image processing skipped for Blob without URI.');
        }

        if (imageUri) {
          const processedImage = await ImageService.processImage(imageUri, {
            width: 200,
            height: 200,
          });
          const response = await fetch(processedImage.uri);
          fileToUpload = await response.blob();
        }
      }

      // Safe file size validation
      if (fileToUpload && typeof fileToUpload === 'object' && 'size' in fileToUpload && typeof fileToUpload.size === 'number' && fileToUpload.size > config.maxFileSize) {
        throw new Error('File size exceeds the maximum limit.');
      }

      // Safe file type validation
      if (fileToUpload && typeof fileToUpload === 'object' && 'type' in fileToUpload && typeof fileToUpload.type === 'string' && !config.allowedTypes.includes('*/*') && !config.allowedTypes.includes(fileToUpload.type)) {
        throw new Error('File type is not allowed.');
      }

      console.log('Attempting to upload file to Supabase:', {
        bucket: config.bucket,
        path: path,
        fileType: (fileToUpload && typeof fileToUpload === 'object' && 'type' in fileToUpload) ? fileToUpload.type : 'unknown',
        fileSize: (fileToUpload && typeof fileToUpload === 'object' && 'size' in fileToUpload) ? fileToUpload.size : 'unknown',
        maxFileSize: config.maxFileSize,
        allowedTypes: config.allowedTypes,
      });

      // More detailed logging right before the upload call
      console.log('Supabase upload parameters:', {
        bucket: config.bucket,
        path: path,
        fileToUploadType: (fileToUpload && typeof fileToUpload === 'object' && 'type' in fileToUpload) ? fileToUpload.type : 'unknown',
        fileToUploadSize: (fileToUpload && typeof fileToUpload === 'object' && 'size' in fileToUpload) ? fileToUpload.size : 'unknown',
        cacheControl: '3600',
        upsert: false,
      });

      const { data, error } = await supabase.storage
        .from(config.bucket)
        .upload(path, fileToUpload, {
          cacheControl: '3600',
          upsert: false,
          // @ts-ignore
          onProgress,
        });

      if (error) {
        console.error('Supabase upload error:', error);
        throw error;
      }

      if (error) {
        throw error;
      }

      let publicURL = '';
      if (config.isPublic) {
        const { data: publicUrlData } = supabase.storage
          .from(config.bucket)
          .getPublicUrl(path);
        publicURL = publicUrlData?.publicUrl || '';
      }

      return { url: publicURL, path: data?.path || '', error: undefined };
    } catch (error) {
      return { url: '', path: '', error: error as Error };
    }
  }

  static async getSignedUrl(
    bucket: string,
    path: string,
    expiresIn: number = 3600
  ): Promise<string> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, expiresIn);

      if (error) {
        throw error;
      }

      return data?.signedUrl || '';
    } catch (error) {
      console.error('Error getting signed URL:', error);
      return '';
    }
  }

  static async deleteFile(
    bucket: string,
    path: string,
    userId: string
  ): Promise<{ success: boolean; error?: Error }> {
    try {
      const { error } = await supabase.storage.from(bucket).remove([path]);

      if (error) {
        throw error;
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: error as Error };
    }
  }

  static async updateUserStorageUsage(userId: string, sizeChange: number): Promise<void> {
    try {
      // Get current storage usage
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('storage_used')
        .eq('id', userId)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      const currentUsage = profile?.storage_used || 0;
      const newUsage = Math.max(0, currentUsage + sizeChange); // Ensure usage doesn't go negative

      // Update storage usage
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ storage_used: newUsage })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }
    } catch (error) {
      console.error('Error updating user storage usage:', error);
      throw error;
    }
  }

  static async getStorageStats(
    userId: string
  ): Promise<{ used: number; limit: number; files: number }> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('storage_used, storage_limit')
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }

      return { used: data?.storage_used || 0, limit: data?.storage_limit || 0, files: 0 };
    } catch (error) {
      console.error('Error getting storage stats:', error);
      return { used: 0, limit: 104857600, files: 0 }; // Return default on error
    }
  }
  static getPublicUrl(path: string, bucket: string): { data: { publicUrl: string } } {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return { data: { publicUrl: data.publicUrl } };
  }

  static async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage.listBuckets();
      if (error) {
        console.error('Supabase connection test failed:', error);
        return false;
      }
      console.log('Supabase connection test successful. Buckets:', data);
      return true;
    } catch (error) {
      console.error('Supabase connection test encountered an exception:', error);
      return false;
    }
  }
}

export { StorageService };
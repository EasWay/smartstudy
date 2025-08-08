import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import { Alert, Platform } from 'react-native';

export interface DownloadProgress {
  totalBytesWritten: number;
  totalBytesExpectedToWrite: number;
  progress: number;
}

class DownloadService {
  static async downloadFile(
    url: string,
    filename: string,
    mimeType?: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      // Validate URL
      if (!url || !url.startsWith('http')) {
        throw new Error(`Invalid URL: ${url}. URL must start with http or https.`);
      }

      // Request permissions for media library
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Media library permission denied');
      }

      // Clean filename and add extension if needed
      const cleanFilename = this.sanitizeFilename(filename);
      const fileExtension = this.getFileExtension(mimeType, url);
      const finalFilename = cleanFilename.includes('.') 
        ? cleanFilename 
        : `${cleanFilename}${fileExtension}`;

      // Create download path
      const downloadPath = `${FileSystem.documentDirectory}${finalFilename}`;

      // Download with progress tracking
      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        downloadPath,
        {},
        (downloadProgress) => {
          const progress = (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100;
          onProgress?.(progress);
        }
      );

      const result = await downloadResumable.downloadAsync();
      
      if (!result) {
        throw new Error('Download failed');
      }

      // Save to media library for images and videos
      if (this.isMediaFile(mimeType)) {
        await MediaLibrary.saveToLibraryAsync(result.uri);
      }

      // Show sharing options
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(result.uri, {
          mimeType: mimeType,
          dialogTitle: `Share ${filename}`,
        });
      }

      return result.uri;
    } catch (error) {
      console.error('Download error:', error);
      throw error;
    }
  }

  static async getDownloadedFiles(): Promise<FileSystem.FileInfo[]> {
    try {
      const downloadDir = FileSystem.documentDirectory;
      if (!downloadDir) return [];

      const files = await FileSystem.readDirectoryAsync(downloadDir);
      const fileInfos = await Promise.all(
        files.map(async (filename) => {
          const fileUri = `${downloadDir}${filename}`;
          const info = await FileSystem.getInfoAsync(fileUri);
          return { ...info, name: filename };
        })
      );

      return fileInfos.filter(info => info.exists) as FileSystem.FileInfo[];
    } catch (error) {
      console.error('Error getting downloaded files:', error);
      return [];
    }
  }

  static async deleteDownloadedFile(filename: string): Promise<void> {
    try {
      const filePath = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.deleteAsync(filePath);
    } catch (error) {
      console.error('Error deleting file:', error);
      throw error;
    }
  }

  static async getFileSize(uri: string): Promise<number> {
    try {
      const info = await FileSystem.getInfoAsync(uri);
      return info.size || 0;
    } catch (error) {
      console.error('Error getting file size:', error);
      return 0;
    }
  }

  static async openFile(uri: string, mimeType?: string): Promise<void> {
    try {
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: mimeType,
        });
      } else {
        Alert.alert('Error', 'File sharing not available on this device');
      }
    } catch (error) {
      console.error('Error opening file:', error);
      Alert.alert('Error', 'Failed to open file');
    }
  }

  private static sanitizeFilename(filename: string): string {
    // Remove invalid characters for file names
    return filename.replace(/[<>:"/\\|?*]/g, '_').trim();
  }

  private static getFileExtension(mimeType?: string, url?: string): string {
    if (mimeType) {
      const mimeToExt: { [key: string]: string } = {
        'application/pdf': '.pdf',
        'image/jpeg': '.jpg',
        'image/png': '.png',
        'image/gif': '.gif',
        'video/mp4': '.mp4',
        'video/quicktime': '.mov',
        'audio/mpeg': '.mp3',
        'audio/wav': '.wav',
        'text/plain': '.txt',
        'application/msword': '.doc',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
        'application/vnd.ms-excel': '.xls',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
        'application/vnd.ms-powerpoint': '.ppt',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
      };
      
      if (mimeToExt[mimeType]) {
        return mimeToExt[mimeType];
      }
    }

    // Try to extract extension from URL
    if (url) {
      const urlParts = url.split('.');
      if (urlParts.length > 1) {
        const ext = urlParts[urlParts.length - 1].split('?')[0]; // Remove query params
        return `.${ext}`;
      }
    }

    return '.bin'; // Default extension
  }

  private static isMediaFile(mimeType?: string): boolean {
    if (!mimeType) return false;
    return mimeType.startsWith('image/') || mimeType.startsWith('video/');
  }

  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static async checkStorageSpace(): Promise<{ free: number; total: number }> {
    try {
      const freeSpace = await FileSystem.getFreeDiskStorageAsync();
      const totalSpace = await FileSystem.getTotalDiskCapacityAsync();
      
      return {
        free: freeSpace,
        total: totalSpace,
      };
    } catch (error) {
      console.error('Error checking storage space:', error);
      return { free: 0, total: 0 };
    }
  }
}

export { DownloadService };
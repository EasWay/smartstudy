import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as IntentLauncher from 'expo-intent-launcher';
import * as DocumentPicker from 'expo-document-picker';
import { Platform, Alert, Linking } from 'react-native';

export interface ExternalAppOptions {
  mimeType?: string;
  filename?: string;
  title?: string;
}

class ExternalAppService {
  /**
   * Download file and open with external app
   */
  static async openWithExternalApp(
    url: string, 
    options: ExternalAppOptions = {},
    onProgress?: (progress: number) => void
  ): Promise<boolean> {
    try {
      const { mimeType, filename, title } = options;
      
      // Generate filename if not provided
      const finalFilename = filename || this.generateFilename(url, mimeType);
      
      console.log('Opening with external app:', { url, filename: finalFilename, mimeType, platform: Platform.OS });

      // Download the file first
      const localUri = await this.downloadFile(url, finalFilename, onProgress);
      if (!localUri) {
        throw new Error('Failed to download file');
      }

      console.log('File downloaded, opening with external app:', localUri);

      // Open with external app based on platform
      if (Platform.OS === 'android') {
        return await this.openWithAndroidApp(localUri, mimeType, title);
      } else {
        return await this.openWithIOSApp(localUri, mimeType, title);
      }

    } catch (error) {
      console.error('Error opening with external app:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Unable to open this file. Please make sure you have a compatible app installed.';
      if (error.message.includes('Download failed')) {
        errorMessage = 'Failed to download the file. Please check your internet connection.';
      } else if (error.message.includes('Sharing not available')) {
        errorMessage = 'File sharing is not available on this device.';
      }
      
      Alert.alert('Cannot Open File', errorMessage, [{ text: 'OK' }]);
      return false;
    }
  }

  /**
   * Download file to local storage
   */
  private static async downloadFile(
    url: string, 
    filename: string,
    onProgress?: (progress: number) => void
  ): Promise<string | null> {
    try {
      const localUri = `${FileSystem.documentDirectory}${filename}`;
      
      // Check if file already exists
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      if (fileInfo.exists) {
        console.log('File already exists locally:', localUri);
        return localUri;
      }

      console.log('Downloading file:', { url, localUri });

      // Download with progress tracking
      const downloadResumable = FileSystem.createDownloadResumable(
        url,
        localUri,
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

      console.log('File downloaded successfully:', result.uri);
      return result.uri;

    } catch (error) {
      console.error('Download error:', error);
      return null;
    }
  }

  /**
   * Open file with Android app using proper content URIs
   */
  private static async openWithAndroidApp(
    localUri: string, 
    mimeType?: string,
    title?: string
  ): Promise<boolean> {
    try {
      console.log('Opening Android file with external app:', { localUri, mimeType });

      // Convert file URI to content URI to avoid FileUriExposedException
      const contentUri = await this.getContentUri(localUri);
      if (!contentUri) {
        console.warn('Could not get content URI, falling back to sharing');
        return await this.shareFile(localUri, title, mimeType);
      }

      console.log('Using content URI for Android intents:', contentUri);

      // Try ACTION_VIEW with MIME type using content URI
      if (mimeType) {
        try {
          console.log('Attempting to open with ACTION_VIEW and MIME type');
          await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: contentUri,
            type: mimeType,
            flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
          });
          console.log('Successfully opened file with ACTION_VIEW');
          return true;
        } catch (viewError) {
          console.warn('ACTION_VIEW with MIME type failed:', viewError);
        }
      }

      // Try ACTION_VIEW without MIME type using content URI
      try {
        console.log('Attempting to open with generic ACTION_VIEW');
        await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
          data: contentUri,
          flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
        });
        console.log('Successfully opened file with generic ACTION_VIEW');
        return true;
      } catch (genericViewError) {
        console.warn('Generic ACTION_VIEW failed:', genericViewError);
      }

      // Try ACTION_SEND as an alternative using content URI
      if (mimeType) {
        try {
          console.log('Attempting to open with ACTION_SEND');
          await IntentLauncher.startActivityAsync('android.intent.action.SEND', {
            type: mimeType,
            flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
            extra: {
              'android.intent.extra.STREAM': contentUri,
            },
          });
          console.log('Successfully opened file with ACTION_SEND');
          return true;
        } catch (sendError) {
          console.warn('ACTION_SEND failed:', sendError);
        }
      }

      // Last resort: use the sharing mechanism (which handles content URIs properly)
      console.log('All direct intents failed, using sharing as last resort');
      return await this.shareFile(localUri, title, mimeType);

    } catch (error) {
      console.error('All Android file opening methods failed:', error);
      return false;
    }
  }

  /**
   * Get content URI for Android file sharing
   */
  private static async getContentUri(localUri: string): Promise<string | null> {
    try {
      if (Platform.OS === 'android') {
        // Check if getContentUriAsync is available (Expo SDK 50+)
        if (typeof (FileSystem as any).getContentUriAsync === 'function') {
          try {
            const contentUri = await (FileSystem as any).getContentUriAsync(localUri);
            console.log('Generated content URI using getContentUriAsync:', contentUri);
            return contentUri;
          } catch (contentUriError) {
            console.warn('getContentUriAsync failed:', contentUriError);
          }
        }

        // Fallback: Check if the URI is already a content URI
        if (localUri.startsWith('content://')) {
          console.log('URI is already a content URI:', localUri);
          return localUri;
        }

        // For file:// URIs on Android 7+, we need to use sharing mechanism
        // which handles the FileProvider conversion automatically
        if (localUri.startsWith('file://')) {
          console.log('File URI detected on Android, will use sharing mechanism for safe handling');
          return null; // Signal that we should use sharing
        }

        console.log('Using original URI (not a file:// URI):', localUri);
        return localUri;
      }
      
      // For iOS, return the original URI
      return localUri;
    } catch (error) {
      console.warn('Failed to get content URI:', error);
      return null; // Signal that we should use sharing as fallback
    }
  }

  /**
   * Open file with iOS app using document interaction
   */
  private static async openWithIOSApp(
    localUri: string, 
    mimeType?: string,
    title?: string
  ): Promise<boolean> {
    try {
      console.log('Opening iOS file with external app:', { localUri, mimeType });

      // For iOS, the sharing mechanism actually provides the "Open In" functionality
      // which is the standard way to open files with external apps on iOS
      // This is not just sharing - it's the iOS way of opening files with other apps
      console.log('Using iOS document interaction (Open In menu)');
      return await this.shareFile(localUri, title, mimeType);
    } catch (error) {
      console.error('iOS file opening failed:', error);
      return false;
    }
  }

  /**
   * Get app URL scheme for specific MIME types (iOS)
   */
  private static getAppUrlForMimeType(mimeType?: string): string | null {
    if (!mimeType) return null;

    // Common app URL schemes for different file types
    const appSchemes: { [key: string]: string } = {
      'application/pdf': 'adobe-reader://', // Adobe Reader
      'application/msword': 'ms-word://', // Microsoft Word
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'ms-word://',
      'application/vnd.ms-excel': 'ms-excel://', // Microsoft Excel
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'ms-excel://',
      'application/vnd.ms-powerpoint': 'ms-powerpoint://', // Microsoft PowerPoint
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'ms-powerpoint://',
    };

    return appSchemes[mimeType] || null;
  }

  /**
   * Share/Open file using system mechanisms (handles content URIs automatically)
   */
  private static async shareFile(
    localUri: string, 
    title?: string,
    mimeType?: string
  ): Promise<boolean> {
    try {
      if (!(await Sharing.isAvailableAsync())) {
        throw new Error('Sharing not available');
      }

      const platform = Platform.OS;
      console.log(`Using ${platform} file opening mechanism:`, { localUri, mimeType, title });

      // Verify file exists before sharing
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      if (!fileInfo.exists) {
        throw new Error(`File does not exist: ${localUri}`);
      }

      // Platform-specific behavior:
      // iOS: Opens the "Open In" menu - this is the standard way to open files with external apps
      // Android: Shows sharing/opening options - Expo handles content URI conversion automatically
      const dialogTitle = platform === 'ios' 
        ? (title ? `Open "${title}" with...` : 'Open with...')
        : (title ? `Open or share "${title}"` : 'Open or share');

      // Expo's Sharing.shareAsync automatically handles:
      // - Content URI conversion on Android (prevents FileUriExposedException)
      // - Proper file provider setup
      // - Cross-platform compatibility
      await Sharing.shareAsync(localUri, {
        mimeType,
        dialogTitle,
        UTI: this.getMimeTypeUTI(mimeType),
      });

      console.log(`${platform} file opening dialog opened successfully`);
      return true;
    } catch (error) {
      console.error('File opening/sharing failed:', error);
      
      // Check if it's the FileUriExposedException and provide helpful message
      if (error.message?.includes('FileUriExposedException')) {
        console.error('FileUriExposedException detected - this should not happen with Expo Sharing API');
        Alert.alert(
          'File Opening Error', 
          'There was a security issue opening this file. Please try downloading it instead.',
          [{ text: 'OK' }]
        );
      }
      
      return false;
    }
  }

  /**
   * Generate filename from URL and MIME type
   */
  private static generateFilename(url: string, mimeType?: string): string {
    try {
      // Try to extract filename from URL
      const urlParts = url.split('/');
      const lastPart = urlParts[urlParts.length - 1];
      
      if (lastPart && lastPart.includes('.')) {
        return lastPart.split('?')[0]; // Remove query parameters
      }

      // Generate filename based on MIME type
      const timestamp = Date.now();
      const extension = this.getExtensionFromMimeType(mimeType);
      return `document_${timestamp}${extension}`;
    } catch (error) {
      return `document_${Date.now()}.bin`;
    }
  }

  /**
   * Get file extension from MIME type
   */
  private static getExtensionFromMimeType(mimeType?: string): string {
    if (!mimeType) return '.bin';

    const mimeToExt: { [key: string]: string } = {
      'application/pdf': '.pdf',
      'application/msword': '.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
      'application/vnd.ms-excel': '.xls',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': '.xlsx',
      'application/vnd.ms-powerpoint': '.ppt',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
      'text/plain': '.txt',
      'text/csv': '.csv',
      'video/mp4': '.mp4',
      'video/quicktime': '.mov',
      'video/x-msvideo': '.avi',
      'audio/mpeg': '.mp3',
      'audio/wav': '.wav',
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
    };

    return mimeToExt[mimeType] || '.bin';
  }

  /**
   * Get UTI for iOS sharing
   */
  private static getMimeTypeUTI(mimeType?: string): string | undefined {
    if (!mimeType) return undefined;

    const mimeToUTI: { [key: string]: string } = {
      'application/pdf': 'com.adobe.pdf',
      'application/msword': 'com.microsoft.word.doc',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'org.openxmlformats.wordprocessingml.document',
      'text/plain': 'public.plain-text',
      'video/mp4': 'public.mpeg-4',
      'audio/mpeg': 'public.mp3',
      'image/jpeg': 'public.jpeg',
      'image/png': 'public.png',
    };

    return mimeToUTI[mimeType];
  }

  /**
   * Open link in browser
   */
  static async openLink(url: string): Promise<boolean> {
    try {
      console.log('Opening link in browser:', url);
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return true;
      } else {
        throw new Error('Cannot open URL');
      }
    } catch (error) {
      console.error('Failed to open link:', error);
      Alert.alert('Cannot Open Link', 'Unable to open this link in your browser.');
      return false;
    }
  }

  /**
   * Check if external app opening is supported for this file type
   */
  static isExternalAppSupported(resourceType: string, mimeType?: string): boolean {
    // Images are handled in-app
    if (resourceType === 'image') {
      return false;
    }

    // Links are handled by openLink method
    if (resourceType === 'link') {
      return false; // We handle links separately
    }

    // All other types should use external apps
    return true;
  }

  /**
   * Get user-friendly message for opening with external app
   */
  static getExternalAppMessage(resourceType: string, mimeType?: string): string {
    const platform = Platform.OS;
    
    if (platform === 'ios') {
      // iOS uses the "Open In" menu which is the standard way
      switch (resourceType) {
        case 'document':
          if (mimeType?.includes('pdf')) {
            return 'Tap to open this PDF with your preferred PDF viewer or other compatible apps.';
          } else if (mimeType?.includes('word')) {
            return 'Tap to open this document with Microsoft Word or other compatible apps.';
          } else if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) {
            return 'Tap to open this spreadsheet with Excel or other compatible apps.';
          } else if (mimeType?.includes('powerpoint') || mimeType?.includes('presentation')) {
            return 'Tap to open this presentation with PowerPoint or other compatible apps.';
          }
          return 'Tap to open this document with a compatible app.';
        case 'video':
          return 'Tap to open this video with your preferred video player.';
        case 'book':
          return 'Tap to open this book with your preferred e-reader.';
        default:
          return 'Tap to open this file with a compatible app.';
      }
    } else {
      // Android tries direct opening first, then shows options
      switch (resourceType) {
        case 'document':
          if (mimeType?.includes('pdf')) {
            return 'Tap to open this PDF. It will try to open directly with your default PDF viewer, or show app options.';
          } else if (mimeType?.includes('word')) {
            return 'Tap to open this document. It will try to open directly with Word or show app options.';
          } else if (mimeType?.includes('excel') || mimeType?.includes('spreadsheet')) {
            return 'Tap to open this spreadsheet. It will try to open directly with Excel or show app options.';
          } else if (mimeType?.includes('powerpoint') || mimeType?.includes('presentation')) {
            return 'Tap to open this presentation. It will try to open directly with PowerPoint or show app options.';
          }
          return 'Tap to open this document. It will try to open directly or show app options.';
        case 'video':
          return 'Tap to open this video. It will try to open directly with your default video player or show app options.';
        case 'book':
          return 'Tap to open this book. It will try to open directly with your default e-reader or show app options.';
        default:
          return 'Tap to open this file. It will try to open directly or show app options.';
      }
    }
  }
}

export { ExternalAppService };
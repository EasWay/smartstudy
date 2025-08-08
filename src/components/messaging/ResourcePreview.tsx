import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { GroupMessage } from '../../types/studyGroups';
import { ExternalAppService } from '../../services/external/externalAppService';
import { DownloadService } from '../../services/download/downloadService';

interface ResourcePreviewProps {
  message: GroupMessage;
  isCurrentUser: boolean;
  onImagePress?: (imageUrl: string) => void;
}

const { width: screenWidth } = Dimensions.get('window');
const MAX_IMAGE_WIDTH = screenWidth * 0.7;
const MAX_IMAGE_HEIGHT = 300;

export const ResourcePreview: React.FC<ResourcePreviewProps> = ({
  message,
  isCurrentUser,
  onImagePress,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
  };

  const getFileIcon = (fileType?: string) => {
    if (!fileType) return 'document-outline';
    
    if (fileType.startsWith('image/')) return 'image-outline';
    if (fileType.startsWith('video/')) return 'videocam-outline';
    if (fileType.startsWith('audio/')) return 'musical-notes-outline';
    if (fileType.includes('pdf')) return 'document-text-outline';
    if (fileType.includes('word') || fileType.includes('doc')) return 'document-outline';
    if (fileType.includes('excel') || fileType.includes('sheet')) return 'grid-outline';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return 'easel-outline';
    
    return 'document-outline';
  };

  const getFileIconColor = (fileType?: string) => {
    if (!fileType) return colors.textSecondary;
    
    if (fileType.includes('pdf')) return '#FF6B6B';
    if (fileType.includes('word') || fileType.includes('doc')) return '#4ECDC4';
    if (fileType.includes('excel') || fileType.includes('sheet')) return '#95E1D3';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '#FFE66D';
    if (fileType.startsWith('video/')) return '#FF6B6B';
    if (fileType.startsWith('audio/')) return '#9B59B6';
    
    return colors.primary;
  };

  const handleDownload = async () => {
    if (!message.file_url || !message.file_name) return;

    try {
      setDownloading(true);
      setDownloadProgress(0);

      await DownloadService.downloadFile(
        message.file_url,
        message.file_name,
        message.file_type,
        (progress) => setDownloadProgress(progress)
      );

      Alert.alert(
        'Download Complete',
        `${message.file_name} has been downloaded successfully.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Download error:', error);
      Alert.alert(
        'Download Failed',
        'Failed to download the file. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setDownloading(false);
      setDownloadProgress(0);
    }
  };

  const handleFilePress = async () => {
    if (!message.file_url || !message.file_name) return;

    // For images, use the image press handler if provided
    if (message.message_type === 'image' && onImagePress) {
      onImagePress(message.file_url);
      return;
    }

    // For other files, open with external app
    try {
      const success = await ExternalAppService.openWithExternalApp(
        message.file_url,
        {
          mimeType: message.file_type,
          filename: message.file_name,
          title: message.file_name,
        }
      );

      if (!success) {
        // If external app opening failed, offer download option
        Alert.alert(
          'Cannot Open File',
          'Unable to open this file with an external app. Would you like to download it instead?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Download', onPress: handleDownload },
          ]
        );
      }
    } catch (error) {
      console.error('Error opening file:', error);
      Alert.alert(
        'Error',
        'Failed to open the file. Please try downloading it instead.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Download', onPress: handleDownload },
        ]
      );
    }
  };

  // Render image preview (WhatsApp style)
  if (message.message_type === 'image' && message.file_url) {
    return (
      <View style={styles.imagePreviewContainer}>
        <TouchableOpacity
          style={styles.imageContainer}
          onPress={handleFilePress}
          activeOpacity={0.9}
        >
          {imageLoading && !imageError && (
            <View style={[styles.imageLoadingContainer, { width: MAX_IMAGE_WIDTH, height: 200 }]}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
          
          {!imageError && (
            <Image
              source={{ uri: message.file_url }}
              style={[
                styles.previewImage,
                imageLoading && styles.hiddenImage
              ]}
              resizeMode="cover"
              onLoad={() => setImageLoading(false)}
              onError={() => {
                setImageError(true);
                setImageLoading(false);
              }}
            />
          )}

          {imageError && (
            <View style={[styles.imageErrorContainer, { width: MAX_IMAGE_WIDTH, height: 200 }]}>
              <Ionicons name="image-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.imageErrorText}>Failed to load image</Text>
            </View>
          )}

          {/* Download button overlay */}
          <TouchableOpacity
            style={[
              styles.downloadButton,
              isCurrentUser ? styles.downloadButtonRight : styles.downloadButtonLeft
            ]}
            onPress={handleDownload}
            disabled={downloading}
          >
            {downloading ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Ionicons name="download-outline" size={20} color={colors.white} />
            )}
          </TouchableOpacity>

          {/* Image caption overlay */}
          {message.message_text && (
            <View style={styles.imageCaptionOverlay}>
              <Text style={styles.imageCaptionText}>{message.message_text}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Download progress */}
        {downloading && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${downloadProgress}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{Math.round(downloadProgress)}%</Text>
          </View>
        )}
      </View>
    );
  }

  // Render file attachment (WhatsApp style)
  if (message.file_url && message.message_type !== 'text') {
    return (
      <View style={styles.filePreviewContainer}>
        <TouchableOpacity
          style={[
            styles.fileContainer,
            isCurrentUser ? styles.fileContainerCurrent : styles.fileContainerOther
          ]}
          onPress={handleFilePress}
          activeOpacity={0.7}
        >
          {/* File icon */}
          <View style={[
            styles.fileIconContainer,
            { backgroundColor: `${getFileIconColor(message.file_type)}20` }
          ]}>
            <Ionicons
              name={getFileIcon(message.file_type)}
              size={32}
              color={getFileIconColor(message.file_type)}
            />
          </View>

          {/* File info */}
          <View style={styles.fileInfo}>
            <Text 
              style={[
                styles.fileName,
                isCurrentUser ? styles.fileNameCurrent : styles.fileNameOther
              ]} 
              numberOfLines={2}
            >
              {message.file_name || 'Unknown file'}
            </Text>
            <Text 
              style={[
                styles.fileSize,
                isCurrentUser ? styles.fileSizeCurrent : styles.fileSizeOther
              ]}
            >
              {formatFileSize(message.file_size)}
            </Text>
          </View>

          {/* Download button */}
          <TouchableOpacity
            style={styles.fileDownloadButton}
            onPress={handleDownload}
            disabled={downloading}
          >
            {downloading ? (
              <ActivityIndicator size="small" color={colors.textSecondary} />
            ) : (
              <Ionicons
                name="download-outline"
                size={24}
                color={isCurrentUser ? colors.white : colors.textSecondary}
              />
            )}
          </TouchableOpacity>
        </TouchableOpacity>

        {/* File caption */}
        {message.message_text && (
          <Text 
            style={[
              styles.fileCaptionText,
              isCurrentUser ? styles.fileCaptionCurrent : styles.fileCaptionOther
            ]}
          >
            {message.message_text}
          </Text>
        )}

        {/* Download progress */}
        {downloading && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View 
                style={[
                  styles.progressFill, 
                  { width: `${downloadProgress}%` }
                ]} 
              />
            </View>
            <Text style={styles.progressText}>{Math.round(downloadProgress)}%</Text>
          </View>
        )}
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  // Image preview styles
  imagePreviewContainer: {
    marginBottom: 4,
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    maxWidth: MAX_IMAGE_WIDTH,
  },
  previewImage: {
    width: MAX_IMAGE_WIDTH,
    height: 200,
    borderRadius: 12,
  },
  hiddenImage: {
    opacity: 0,
  },
  imageLoadingContainer: {
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  imageErrorContainer: {
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  imageErrorText: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 8,
  },
  downloadButton: {
    position: 'absolute',
    top: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  downloadButtonRight: {
    right: 8,
  },
  downloadButtonLeft: {
    left: 8,
  },
  imageCaptionOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
  },
  imageCaptionText: {
    color: colors.white,
    fontSize: 14,
    lineHeight: 18,
  },

  // File preview styles
  filePreviewContainer: {
    marginBottom: 4,
  },
  fileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    minWidth: 250,
    maxWidth: MAX_IMAGE_WIDTH,
  },
  fileContainerCurrent: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  fileContainerOther: {
    backgroundColor: colors.surface,
  },
  fileIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  fileInfo: {
    flex: 1,
    marginRight: 12,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  fileNameCurrent: {
    color: colors.white,
  },
  fileNameOther: {
    color: colors.text,
  },
  fileSize: {
    fontSize: 12,
  },
  fileSizeCurrent: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  fileSizeOther: {
    color: colors.textSecondary,
  },
  fileDownloadButton: {
    padding: 8,
  },
  fileCaptionText: {
    fontSize: 14,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  fileCaptionCurrent: {
    color: colors.white,
  },
  fileCaptionOther: {
    color: colors.text,
  },

  // Progress styles
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: colors.textSecondary,
    minWidth: 35,
    textAlign: 'right',
  },
});
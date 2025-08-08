import React, { useState } from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { ThumbnailService } from '../../services/edgeFunctions/thumbnailService';

interface FilePreviewThumbnailProps {
  resourceType: string;
  fileType?: string;
  thumbnailUrl?: string;
  size?: number;
}

const FilePreviewThumbnail: React.FC<FilePreviewThumbnailProps> = ({
  resourceType,
  fileType,
  thumbnailUrl,
  size = 80,
}) => {
  const [imageLoadError, setImageLoadError] = useState(false);
  const [fallbackToIcon, setFallbackToIcon] = useState(false);
  const getIcon = (resourceType: string, fileType?: string) => {
    switch (resourceType) {
      case 'document':
        if (fileType?.includes('pdf')) return 'document-text';
        if (fileType?.includes('word') || fileType?.includes('officedocument.wordprocessingml')) return 'document';
        if (fileType?.includes('presentation')) return 'easel';
        if (fileType?.includes('spreadsheet')) return 'grid';
        if (fileType?.includes('text')) return 'document-text';
        return 'document-outline';
      case 'link':
        return 'link';
      case 'video':
        return 'videocam';
      case 'book':
        return 'book';
      case 'image':
        return 'image';
      default:
        return 'help-circle';
    }
  };

  const getIconColor = (resourceType: string, fileType?: string) => {
    switch (resourceType) {
      case 'document':
        if (fileType?.includes('pdf')) return '#FF6B6B';
        if (fileType?.includes('word')) return '#4ECDC4';
        if (fileType?.includes('presentation')) return '#FFE66D';
        if (fileType?.includes('spreadsheet')) return '#95E1D3';
        return Colors.primary;
      case 'video':
        return '#FF6B6B';
      case 'image':
        return '#4ECDC4';
      case 'book':
        return '#A8E6CF';
      case 'link':
        return '#FFD93D';
      default:
        return Colors.primary;
    }
  };

  // Show thumbnail if available and not failed to load
  if (thumbnailUrl && !imageLoadError && !fallbackToIcon) {
    return (
      <View style={[styles.container, { width: size, height: size }]}>
        <Image
          source={{ uri: thumbnailUrl }}
          style={[styles.thumbnail, { width: size, height: size }]}
          resizeMode="cover"
          onError={(error) => {
            console.warn('Failed to load thumbnail:', { thumbnailUrl, error: error.nativeEvent.error });
            setImageLoadError(true);
            // For images without thumbnails, try to fallback to a generic icon
            if (resourceType === 'image') {
              setFallbackToIcon(true);
            }
          }}
        />
        <View style={styles.overlay}>
          <Ionicons name="eye" size={16} color="white" />
        </View>
      </View>
    );
  }

  // For images that failed to load thumbnail, try to show document icon if available
  if (resourceType === 'image' && (imageLoadError || fallbackToIcon)) {
    const documentIconUrl = ThumbnailService.getDocumentIconUrl('image', fileType);
    if (documentIconUrl) {
      return (
        <View style={[styles.container, { width: size, height: size }]}>
          <Image
            source={{ uri: documentIconUrl }}
            style={[styles.thumbnail, { width: size, height: size }]}
            resizeMode="contain"
            onError={() => {
              // If document icon also fails, fall back to regular icon
            }}
          />
          <View style={styles.overlay}>
            <Ionicons name="eye" size={16} color="white" />
          </View>
        </View>
      );
    }
    // If no document icon available, fall through to regular icon
  }

  // Default icon fallback
  return (
    <View style={[
      styles.iconContainer, 
      { 
        width: size, 
        height: size,
        backgroundColor: `${getIconColor(resourceType, fileType)}20`
      }
    ]}>
      <Ionicons 
        name={getIcon(resourceType, fileType)} 
        size={size * 0.4} 
        color={getIconColor(resourceType, fileType)} 
      />
      {/* Preview indicator */}
      <View style={styles.previewIndicator}>
        <Ionicons name="eye" size={12} color={Colors.textSecondary} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  thumbnail: {
    borderRadius: 10,
  },
  overlay: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  previewIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: Colors.surface,
    borderRadius: 6,
    width: 14,
    height: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1,
    elevation: 1,
  },
});

export default FilePreviewThumbnail;
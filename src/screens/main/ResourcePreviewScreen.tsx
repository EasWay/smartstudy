import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Dimensions,
  ScrollView,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Resource } from '../../types/resources';
import { ResourceService } from '../../services/resources/resourceService';
import { DownloadService } from '../../services/download/downloadService';
import { ExternalAppService } from '../../services/external/externalAppService';
import { useNavigation, useRoute } from '@react-navigation/native';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface RouteParams {
  resource: Resource;
}

function ResourcePreviewScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { resource } = route.params as RouteParams;

  const [loading, setLoading] = useState(true);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [isOpeningExternal, setIsOpeningExternal] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [shouldUseExternalApp, setShouldUseExternalApp] = useState(false);

  useEffect(() => {
    // Handle links separately
    if (resource.resourceType === 'link') {
      setLoading(false);
      // Don't automatically open link - let user choose
      return;
    }

    // Check if we should use external app for this resource type
    const useExternal = ExternalAppService.isExternalAppSupported(resource.resourceType, resource.fileType);
    setShouldUseExternalApp(useExternal);

    if (useExternal) {
      // For external app resources, we don't need to load preview
      setLoading(false);
      // Don't automatically open - let user choose when to open
    } else {
      // For images, load preview as usual
      loadPreview();
    }
  }, []);

  const loadPreview = async () => {
    try {
      setLoading(true);
      setError(null);

      let url: string | null = null;

      // Try different URL sources in order of preference
      if (resource.fileUrl && resource.fileUrl.startsWith('http')) {
        url = resource.fileUrl;
      } else if (resource.externalUrl && resource.externalUrl.startsWith('http')) {
        url = resource.externalUrl;
      } else if (resource.filePath) {
        try {
          url = await ResourceService.getSignedUrl(resource.filePath);
        } catch (error) {
          console.error('Failed to generate signed URL for preview:', error);
        }
      }

      if (url && url.startsWith('http')) {
        setPreviewUrl(url);
      } else {
        console.warn('No valid preview URL found for resource:', {
          id: resource.id,
          title: resource.title,
          fileUrl: resource.fileUrl,
          filePath: resource.filePath,
          externalUrl: resource.externalUrl
        });
        setError('Preview not available');
      }
    } catch (err) {
      console.error('Error loading preview:', err);
      setError('Failed to load preview');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenLink = async () => {
    try {
      const linkUrl = resource.externalUrl || resource.fileUrl;
      if (!linkUrl) {
        Alert.alert('Error', 'No link URL available');
        return;
      }

      const success = await ExternalAppService.openLink(linkUrl);
      if (success) {
        // Optionally navigate back after successful opening
        // navigation.goBack();
      }
    } catch (err) {
      console.error('Link opening error:', err);
      Alert.alert('Error', 'Failed to open link');
    }
  };

  const handleOpenWithExternalApp = async () => {
    try {
      setIsOpeningExternal(true);
      setDownloadProgress(0);

      let fileUrl: string | null = null;

      // Try to get a valid file URL
      if (previewUrl && previewUrl.startsWith('http')) {
        fileUrl = previewUrl;
      } else if (resource.fileUrl && resource.fileUrl.startsWith('http')) {
        fileUrl = resource.fileUrl;
      } else if (resource.externalUrl && resource.externalUrl.startsWith('http')) {
        fileUrl = resource.externalUrl;
      } else if (resource.filePath) {
        // Generate signed URL for storage path
        try {
          fileUrl = await ResourceService.getSignedUrl(resource.filePath);
        } catch (error) {
          console.error('Failed to generate signed URL for external app:', error);
        }
      }

      if (!fileUrl || !fileUrl.startsWith('http')) {
        Alert.alert('Error', 'No valid file URL available');
        return;
      }

      console.log('Opening with external app:', fileUrl);

      const success = await ExternalAppService.openWithExternalApp(
        fileUrl,
        {
          mimeType: resource.fileType,
          filename: resource.title,
          title: resource.title,
        },
        (progress) => setDownloadProgress(progress)
      );

      if (success) {
        // Optionally navigate back after successful opening
        // navigation.goBack();
      }
    } catch (err) {
      console.error('External app error:', err);
      Alert.alert('Error', 'Failed to open file with external app');
    } finally {
      setIsOpeningExternal(false);
      setDownloadProgress(0);
    }
  };

  const handleDownload = async () => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);

      let downloadUrl: string | null = null;

      // Try to get a valid download URL
      if (previewUrl && previewUrl.startsWith('http')) {
        downloadUrl = previewUrl;
      } else if (resource.fileUrl && resource.fileUrl.startsWith('http')) {
        downloadUrl = resource.fileUrl;
      } else if (resource.externalUrl && resource.externalUrl.startsWith('http')) {
        downloadUrl = resource.externalUrl;
      } else if (resource.filePath) {
        // Generate signed URL for storage path
        try {
          downloadUrl = await ResourceService.getSignedUrl(resource.filePath);
        } catch (error) {
          console.error('Failed to generate signed URL for download:', error);
        }
      }

      if (!downloadUrl || !downloadUrl.startsWith('http')) {
        Alert.alert('Error', 'No valid download URL available');
        return;
      }

      console.log('Downloading from URL:', downloadUrl);

      await DownloadService.downloadFile(
        downloadUrl,
        resource.title,
        resource.fileType,
        (progress) => setDownloadProgress(progress)
      );

      Alert.alert('Success', 'File downloaded successfully!');
    } catch (err) {
      console.error('Download error:', err);
      Alert.alert('Error', 'Failed to download file');
    } finally {
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const renderPreviewContent = () => {
    // Handle links
    if (resource.resourceType === 'link') {
      return (
        <View style={styles.centerContainer}>
          <View style={styles.externalAppContainer}>
            <Ionicons
              name="link"
              size={80}
              color={Colors.primary}
            />
            <Text style={styles.externalAppTitle}>{resource.title}</Text>
            <Text style={styles.externalAppMessage}>
              This link will open in your browser.
            </Text>

            <TouchableOpacity
              style={styles.externalAppButton}
              onPress={handleOpenLink}
            >
              <Ionicons name="open-outline" size={20} color="white" />
              <Text style={styles.externalAppButtonText}>
                Open Link
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Handle external app resources
    if (shouldUseExternalApp) {
      return (
        <View style={styles.centerContainer}>
          <View style={styles.externalAppContainer}>
            <Ionicons
              name={getResourceIcon(resource.resourceType)}
              size={80}
              color={Colors.primary}
            />
            <Text style={styles.externalAppTitle}>{resource.title}</Text>
            <Text style={styles.externalAppMessage}>
              {ExternalAppService.getExternalAppMessage(resource.resourceType, resource.fileType)}
            </Text>

            {isOpeningExternal && (
              <View style={styles.progressContainer}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.progressText}>
                  {downloadProgress > 0 ? `Downloading... ${Math.round(downloadProgress)}%` : 'Preparing file...'}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[styles.externalAppButton, isOpeningExternal && styles.buttonDisabled]}
              onPress={handleOpenWithExternalApp}
              disabled={isOpeningExternal}
            >
              <Ionicons name="open-outline" size={20} color="white" />
              <Text style={styles.externalAppButtonText}>
                {isOpeningExternal ? 'Opening...' : 'Open with App'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.downloadAlternativeButton}
              onPress={handleDownload}
              disabled={isDownloading}
            >
              <Ionicons name="download-outline" size={16} color={Colors.primary} />
              <Text style={styles.downloadAlternativeText}>
                Or download to device
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    // Handle in-app preview (images only)
    if (loading) {
      return (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Loading preview...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle" size={64} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadPreview}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!previewUrl) {
      return (
        <View style={styles.centerContainer}>
          <Ionicons name="document" size={64} color={Colors.textSecondary} />
          <Text style={styles.noPreviewText}>Preview not available</Text>
        </View>
      );
    }

    // Only images should reach here for in-app preview
    if (resource.resourceType === 'image') {
      return (
        <ScrollView
          style={styles.imageContainer}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
        >
          <Image
            source={{ uri: previewUrl }}
            style={styles.previewImage}
            resizeMode="contain"
          />
        </ScrollView>
      );
    }

    // Fallback for any other case
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="help-circle" size={64} color={Colors.textSecondary} />
        <Text style={styles.noPreviewText}>Unsupported file type</Text>
      </View>
    );
  };

  const getResourceIcon = (resourceType: string) => {
    switch (resourceType) {
      case 'document': return 'document-text' as const;
      case 'video': return 'videocam' as const;
      case 'book': return 'book' as const;
      case 'link': return 'link' as const;
      default: return 'document' as const;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.primaryText} />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {resource.title}
          </Text>
          {resource.fileSize && (
            <Text style={styles.headerSubtitle}>
              {(resource.fileSize / (1024 * 1024)).toFixed(2)} MB
            </Text>
          )}
        </View>

        {shouldUseExternalApp ? (
          <TouchableOpacity
            style={[styles.downloadButton, isOpeningExternal && styles.downloadButtonDisabled]}
            onPress={handleOpenWithExternalApp}
            disabled={isOpeningExternal}
          >
            {isOpeningExternal ? (
              <ActivityIndicator size="small" color={Colors.primaryText} />
            ) : (
              <Ionicons name="open-outline" size={24} color={Colors.primaryText} />
            )}
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.downloadButton, isDownloading && styles.downloadButtonDisabled]}
            onPress={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color={Colors.primaryText} />
            ) : (
              <Ionicons name="download" size={24} color={Colors.primaryText} />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Progress Display */}
      {(isDownloading || isOpeningExternal) && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[styles.progressFill, { width: `${downloadProgress}%` }]}
            />
          </View>
          <Text style={styles.progressText}>
            {isOpeningExternal
              ? (downloadProgress > 0 ? `Preparing... ${Math.round(downloadProgress)}%` : 'Opening...')
              : `${Math.round(downloadProgress)}%`
            }
          </Text>
        </View>
      )}

      {/* Preview Content */}
      <View style={styles.previewContainer}>
        {renderPreviewContent()}
      </View>

      {/* Resource Info */}
      <View style={styles.infoContainer}>
        {resource.description && (
          <Text style={styles.description}>{resource.description}</Text>
        )}
        <View style={styles.metaInfo}>
          {resource.subject && (
            <Text style={styles.metaText}>Subject: {resource.subject}</Text>
          )}
          {resource.gradeLevel && (
            <Text style={styles.metaText}>Grade: {resource.gradeLevel}</Text>
          )}
          <Text style={styles.metaText}>Type: {resource.resourceType}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingTop: 50, // Account for status bar
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.primaryText,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    opacity: 0.8,
  },
  downloadButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  downloadButtonDisabled: {
    opacity: 0.5,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.surface,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: Colors.textSecondary,
    minWidth: 35,
    textAlign: 'right',
  },
  previewContainer: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.error,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.primary,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.primaryText,
    fontWeight: '600',
  },
  noPreviewText: {
    marginTop: 12,
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  imageContainer: {
    flex: 1,
  },
  previewImage: {
    width: screenWidth,
    height: screenHeight - 200, // Account for header and info
  },
  videoPlayer: {
    flex: 1,
  },
  webView: {
    flex: 1,
  },
  documentInfo: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  documentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    marginTop: 16,
  },
  documentType: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 8,
  },
  documentSize: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  infoContainer: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  description: {
    fontSize: 14,
    color: Colors.primary,
    lineHeight: 20,
    marginBottom: 12,
  },
  metaInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metaText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginRight: 16,
    marginBottom: 4,
  },
  externalAppContainer: {
    alignItems: 'center',
    padding: 32,
    maxWidth: 300,
  },
  externalAppTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primary,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  externalAppMessage: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  externalAppButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    marginBottom: 16,
    minWidth: 160,
    justifyContent: 'center',
  },
  externalAppButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  downloadAlternativeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  downloadAlternativeText: {
    color: Colors.primary,
    fontSize: 14,
    marginLeft: 6,
  },
  buttonDisabled: {
    opacity: 0.6,
  }
});

export default ResourcePreviewScreen;
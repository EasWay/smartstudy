import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, TextInput, ActivityIndicator, Alert, ScrollView, Platform } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { ImageService } from '../../services/image/ImageService';
import * as ImageManipulator from 'expo-image-manipulator';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import AuthButton from '../auth/AuthButton';
import { ResourceService } from '../../services/resources/resourceService';
import { StorageService } from '../../services/storage/StorageService';
import { uploadFileWithSessionReactNative } from '../../services/storage/uploadFileWithSessionReactNative';
import { sanitizeFilename } from '../../utils/sanitizeFilename';
import { AuthService } from '../../services/supabase/auth';
import { useAuth } from '../../context/AuthContext';
import { GRADE_LEVELS, SUBJECTS } from '../../types/profile'; // Reusing these for resource categorization

interface UploadModalProps {
  isVisible: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

const UploadModal: React.FC<UploadModalProps> = ({ isVisible, onClose, onUploadSuccess }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedGradeLevel, setSelectedGradeLevel] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileType, setFileType] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setSelectedSubject('');
    setSelectedGradeLevel('');
    setIsPublic(true);
    setFileUri(null);
    setFileName(null);
    setFileType(null);
    setFileSize(null);
    setUploadProgress(0);
  };

  const pickFile = async () => {
    try {
      Alert.alert(
        'Select File Type',
        'Do you want to upload an image/video or a document?',
        [
          { text: 'Image/Video', onPress: () => handleMediaPick() },
          { text: 'Document', onPress: () => handleDocumentPick() },
          { text: 'Cancel', style: 'cancel' },
        ],
        { cancelable: true }
      );
    } catch (error) {
      console.error('Error presenting file type choice:', error);
      Alert.alert('Error', 'Failed to select file type.');
    }
  };

  const handleMediaPick = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access media library is required!');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsMultipleSelection: false,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setFileUri(asset.uri);
        setFileName(asset.fileName || asset.uri.split('/').pop() || 'unknown_file');
        setFileType(asset.mimeType || 'application/octet-stream');
        setFileSize(asset.fileSize || 0);
      }
    } catch (error) {
      console.error('Error picking media:', error);
      Alert.alert('Error', 'Failed to pick media.');
    }
  };

  const handleDocumentPick = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*', // Allow all file types
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        setFileUri(asset.uri);
        setFileName(asset.name);
        setFileType(asset.mimeType || 'application/octet-stream');
        setFileSize(asset.size || 0);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document.');
    }
  };

  const handleUpload = async () => {

    if (!user?.id) {
      Alert.alert('Error', 'User not authenticated.');
      return;
    }
    if (!fileUri || !fileName || !fileType || !fileSize) {
      Alert.alert('Error', 'Please select a file to upload.');
      return;
    }
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a title for the resource.');
      return;
    }

    setUploading(true);

    // Test Supabase connection before proceeding with upload
    const isConnected = await StorageService.testConnection();
    if (!isConnected) {
      Alert.alert('Connection Error', 'Could not connect to Supabase. Please check your network and Supabase configuration.');
      setUploading(false);
      return;
    }

    // Step 7: Check Supabase session token (RLS)
    let supabaseSession = null;
    let supabaseToken = null;
    try {
      const { session, error } = await AuthService.getCurrentSession();
      if (error || !session) {
        Alert.alert('Auth Error', 'No valid Supabase session. Please log in again.');
        setUploading(false);
        return;
      }
      supabaseSession = session;
      supabaseToken = session.access_token;
      // Debug log
      console.log('Supabase session:', supabaseSession);
      console.log('Supabase access token:', supabaseToken);
    } catch (err) {
      Alert.alert('Auth Error', 'Failed to check Supabase session.');
      setUploading(false);
      return;
    }

    let fileToUpload: Blob | null = null;
    let finalFileUri = fileUri;
    let finalFileType = fileType;
    // Sanitize the file name before upload
    let finalFileName = sanitizeFilename(fileName);
    let finalFileSize = fileSize;
    let thumbnailUrl: string | null = null;

    // Log file info for debugging
    console.log('Uploading file:', {
      fileUri: finalFileUri,
      fileName: finalFileName,
      fileType: finalFileType,
      fileSize: finalFileSize,
      userId: user.id,
    });
    // Use undefined for thumbnailUrl to match Resource type
    let safeThumbnailUrl: string | undefined = undefined;

    try {
      const storageConfig = {
        bucket: 'edresources',
        maxFileSize: 50 * 1024 * 1024, // 50MB
        allowedTypes: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-powerpoint',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'image/jpeg',
          'image/png',
          'image/webp',
          'video/mp4',
          'video/webm',
        ],
        generateThumbnail: finalFileType.startsWith('image/') || finalFileType.startsWith('video/'),
        isPublic: isPublic,
      };


      // Handle image/video processing for thumbnail generation
      if (storageConfig.generateThumbnail && finalFileUri) {
        if (finalFileType.startsWith('image/')) {
          const processedImage = await ImageService.processImage(finalFileUri, {
            width: 400, // Example thumbnail width
            height: 400, // Example thumbnail height
            compress: 0.8,
            format: ImageManipulator.SaveFormat.JPEG,
          });
          finalFileUri = processedImage.uri;
          safeThumbnailUrl = processedImage.uri;
        } else if (finalFileType.startsWith('video/')) {
          // For videos, you might use a different library or a backend service
          // For now, we'll just use the video URI as a placeholder for thumbnail
          safeThumbnailUrl = finalFileUri;
        }
      }

      const filePath = `${user.id}/${Date.now()}_${finalFileName}`;

      // Log before upload
      console.log('Uploading to storage:', { filePath, storageConfig });

      // Use React Native specific upload service
      const fileObject = {
        uri: finalFileUri,
        name: finalFileName,
        type: finalFileType,
        size: finalFileSize,
      };

      const uploadResult = await uploadFileWithSessionReactNative(
        fileObject,
        filePath,
        storageConfig.bucket,
        (progress: number) => {
          setUploadProgress(progress);
        }
      );

      if (!uploadResult) {
        throw new Error('Upload failed - no result returned');
      }

      const url = uploadResult.publicUrl || '';

      // Determine resourceType more accurately
      let resourceType: 'document' | 'link' | 'video' | 'book' | 'image' = 'document';
      if (finalFileType.startsWith('image/')) {
        resourceType = 'image';
      } else if (finalFileType.startsWith('video/')) {
        resourceType = 'video';
      } else if (finalFileType.includes('pdf')) {
        resourceType = 'document';
      } else if (finalFileType.includes('msword') || finalFileType.includes('officedocument')) {
        resourceType = 'document';
      }

      const newResource = {
        title: title.trim(),
        description: description.trim() || undefined,
        resourceType: resourceType,
        fileUrl: url,
        filePath: filePath,
        fileSize: finalFileSize,
        fileType: finalFileType,
        thumbnailUrl: safeThumbnailUrl,
        externalUrl: undefined,
        subject: selectedSubject || undefined,
        gradeLevel: selectedGradeLevel || undefined,
        uploadedBy: user.id,
        isPublic: isPublic,
        downloadCount: 0,
      };

      await ResourceService.createResource(newResource);

      Alert.alert('Success', 'Resource uploaded successfully!');
      onUploadSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Upload error:', error);
      setUploading(false);
      Alert.alert('Upload Failed', error instanceof Error ? error.message : 'Unknown error occurred during upload');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      onRequestClose={onClose}
      transparent={true}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Upload New Resource</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.formContainer}>
            <Text style={styles.label}>Title</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter resource title"
              placeholderTextColor={Colors.textSecondary}
              value={title}
              onChangeText={setTitle}
            />

            <Text style={styles.label}>Description (Optional)</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Brief description of the resource"
              placeholderTextColor={Colors.textSecondary}
              multiline
              numberOfLines={4}
              value={description}
              onChangeText={setDescription}
            />

            <Text style={styles.label}>Subject</Text>
            <View style={styles.chipContainer}>
              {SUBJECTS.map((subject) => (
                <TouchableOpacity
                  key={subject}
                  style={[styles.chip,
                    selectedSubject === subject && styles.chipSelected,
                  ]}
                  onPress={() => setSelectedSubject(subject)}
                >
                  <Text style={[styles.chipText,
                    selectedSubject === subject && styles.chipTextSelected,
                  ]}>
                    {subject}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>Grade Level</Text>
            <View style={styles.chipContainer}>
              {GRADE_LEVELS.map((grade) => (
                <TouchableOpacity
                  key={grade}
                  style={[styles.chip,
                    selectedGradeLevel === grade && styles.chipSelected,
                  ]}
                  onPress={() => setSelectedGradeLevel(grade)}
                >
                  <Text style={[styles.chipText,
                    selectedGradeLevel === grade && styles.chipTextSelected,
                  ]}>
                    {grade}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>File</Text>
            <TouchableOpacity style={styles.filePickerButton} onPress={pickFile}>
              <Ionicons name="folder-open-outline" size={20} color={Colors.primary} />
              <Text style={styles.filePickerButtonText}>Select File</Text>
            </TouchableOpacity>
            {fileUri && (
              <View style={styles.fileInfoContainer}>
                <Text style={styles.fileInfoText}>Selected: {fileName}</Text>
                <Text style={styles.fileInfoText}>Size: {fileSize != null ? (fileSize / (1024 * 1024)).toFixed(2) : 'N/A'} MB</Text>
              </View>
            )}

            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setIsPublic(!isPublic)}
              >
                <Ionicons
                  name={isPublic ? 'checkbox-outline' : 'square-outline'}
                  size={24}
                  color={Colors.primary}
                />
              </TouchableOpacity>
              <Text style={styles.checkboxLabel}>Publicly Visible</Text>
            </View>

            {uploading && (
              <View style={styles.progressContainer}>
                <Text style={styles.progressText}>Uploading: {uploadProgress}%</Text>
                <View style={styles.progressBarBackground}>
                  <View style={[styles.progressBarFill, { width: `${uploadProgress}%` }]} />
                </View>
              </View>
            )}

            <AuthButton
              title={uploading ? 'Uploading...' : 'Upload Resource'}
              onPress={handleUpload}
              loading={uploading}
              disabled={uploading || !fileUri || !title}
              style={styles.uploadButton}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ...existing code...
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.background,
    borderRadius: 10,
    width: '90%',
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primaryText,
  },
  closeButton: {
    padding: 5,
  },
  formContainer: {
    padding: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primaryText,
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.primaryText,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  chip: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  chipTextSelected: {
    color: Colors.primaryText,
  },
  filePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
  },
  filePickerButtonText: {
    marginLeft: 10,
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  fileInfoContainer: {
    marginTop: 10,
    padding: 10,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fileInfoText: {
    color: Colors.textSecondary,
    fontSize: 14,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    marginBottom: 10,
  },
  checkbox: {
    padding: 5,
    marginRight: 10,
  },
  checkboxLabel: {
    fontSize: 16,
    color: Colors.primaryText,
  },
  progressContainer: {
    marginTop: 15,
    marginBottom: 10,
  },
  progressText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 5,
  },
  progressBarBackground: {
    height: 10,
    backgroundColor: Colors.border,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 5,
  },
  uploadButton: {
    marginTop: 20,
    marginBottom: 10,
  },
});

export default UploadModal;

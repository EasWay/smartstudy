import React, { useState } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { colors } from '../../constants/colors';
import { AttachmentModal } from './AttachmentModal';

interface MessageInputProps {
  onSendMessage: (text: string) => Promise<void>;
  onSendFile: (file: {
    uri: string;
    name: string;
    type: string;
    size: number;
  }, messageText?: string) => Promise<void>;
  placeholder?: string;
  disabled?: boolean;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  onSendFile,
  placeholder = "Type a message...",
  disabled = false,
}) => {
  const [message, setMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [showAttachmentModal, setShowAttachmentModal] = useState(false);

  const handleSendMessage = async () => {
    if (message.trim() && !disabled && !isUploading) {
      const messageToSend = message.trim();
      setMessage('');
      await onSendMessage(messageToSend);
    }
  };

  const showAttachmentOptions = () => {
    setShowAttachmentModal(true);
  };

  const openCamera = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await handleFileSelection(result.assets[0]);
      }
    } catch (error) {
      console.error('Error opening camera:', error);
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  const openImagePicker = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Required', 'Photo library permission is required to select images.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        await handleFileSelection(result.assets[0]);
      }
    } catch (error) {
      console.error('Error opening image picker:', error);
      Alert.alert('Error', 'Failed to open image picker');
    }
  };

  const openDocumentPicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        await handleFileSelection(result.assets[0]);
      }
    } catch (error) {
      console.error('Error opening document picker:', error);
      Alert.alert('Error', 'Failed to open document picker');
    }
  };

  const handleFileSelection = async (asset: any) => {
    try {
      setIsUploading(true);

      // Validate file size (max 50MB)
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (asset.fileSize && asset.fileSize > maxSize) {
        Alert.alert('File Too Large', 'Please select a file smaller than 50MB');
        return;
      }

      const file = {
        uri: asset.uri,
        name: asset.fileName || asset.name || `file_${Date.now()}`,
        type: asset.mimeType || asset.type || 'application/octet-stream',
        size: asset.fileSize || asset.size || 0,
      };

      // If there's text in the input, include it with the file
      const messageText = message.trim() || undefined;
      setMessage('');

      await onSendFile(file, messageText);
    } catch (error) {
      console.error('Error handling file selection:', error);
      Alert.alert('Error', 'Failed to process selected file');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputContainer}>
        <TouchableOpacity
          style={styles.attachButton}
          onPress={showAttachmentOptions}
          disabled={disabled || isUploading}
        >
          {isUploading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons name="attach" size={24} color={colors.primary} />
          )}
        </TouchableOpacity>

        <TextInput
          style={styles.textInput}
          value={message}
          onChangeText={setMessage}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          multiline
          maxLength={1000}
          editable={!disabled && !isUploading}
        />

        <TouchableOpacity
          style={[
            styles.sendButton,
            (!message.trim() || disabled || isUploading) && styles.sendButtonDisabled
          ]}
          onPress={handleSendMessage}
          disabled={!message.trim() || disabled || isUploading}
        >
          <Ionicons
            name="send"
            size={20}
            color={(!message.trim() || disabled || isUploading) ? colors.textSecondary : colors.white}
          />
        </TouchableOpacity>
      </View>

      <AttachmentModal
        visible={showAttachmentModal}
        onClose={() => setShowAttachmentModal(false)}
        onCamera={openCamera}
        onPhotoLibrary={openImagePicker}
        onDocument={openDocumentPicker}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.surface,
    borderRadius: 25,
    paddingHorizontal: 4,
    paddingVertical: 4,
    minHeight: 50,
  },
  attachButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxHeight: 100,
    textAlignVertical: 'center',
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  sendButtonDisabled: {
    backgroundColor: colors.border,
  },
});
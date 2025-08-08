import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';

interface AttachmentModalProps {
  visible: boolean;
  onClose: () => void;
  onCamera: () => void;
  onPhotoLibrary: () => void;
  onDocument: () => void;
}

const { width } = Dimensions.get('window');

export const AttachmentModal: React.FC<AttachmentModalProps> = ({
  visible,
  onClose,
  onCamera,
  onPhotoLibrary,
  onDocument,
}) => {
  const handleOptionPress = (action: () => void) => {
    onClose();
    setTimeout(action, 100); // Small delay to allow modal to close
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.container}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modal}>
              <View style={styles.header}>
                <Text style={styles.title}>Attach File</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <Ionicons name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.options}>
                <TouchableOpacity
                  style={styles.option}
                  onPress={() => handleOptionPress(onCamera)}
                >
                  <View style={[styles.iconContainer, { backgroundColor: colors.success }]}>
                    <Ionicons name="camera" size={24} color={colors.white} />
                  </View>
                  <Text style={styles.optionText}>Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.option}
                  onPress={() => handleOptionPress(onPhotoLibrary)}
                >
                  <View style={[styles.iconContainer, { backgroundColor: colors.primary }]}>
                    <Ionicons name="images" size={24} color={colors.white} />
                  </View>
                  <Text style={styles.optionText}>Photo Library</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.option}
                  onPress={() => handleOptionPress(onDocument)}
                >
                  <View style={[styles.iconContainer, { backgroundColor: colors.warning }]}>
                    <Ionicons name="document" size={24} color={colors.white} />
                  </View>
                  <Text style={styles.optionText}>Document</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: width * 0.8,
    maxWidth: 300,
  },
  modal: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  closeButton: {
    padding: 4,
  },
  options: {
    paddingVertical: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: colors.text,
  },
});
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { CreateGroupData } from '../../types/studyGroups';
import { StudyGroupsService } from '../../services/studyGroups';
import { colors } from '../../constants/colors';

interface CreateGroupModalProps {
  visible: boolean;
  onClose: () => void;
  onGroupCreated: () => void;
}

const SUBJECTS = [
  'Mathematics',
  'Science',
  'English',
  'History',
  'Geography',
  'Physics',
  'Chemistry',
  'Biology',
  'Computer Science',
  'Literature',
  'Economics',
  'Social Studies'
];

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  visible,
  onClose,
  onGroupCreated
}) => {
  const [formData, setFormData] = useState<CreateGroupData>({
    name: '',
    description: '',
    subject: '',
    privacy_level: 'public',
    max_members: 20
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      subject: '',
      privacy_level: 'public',
      max_members: 20
    });
    setErrors({});
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Group name is required';
    } else if (formData.name.trim().length < 3) {
      newErrors.name = 'Group name must be at least 3 characters';
    }

    if (!formData.subject) {
      newErrors.subject = 'Please select a subject';
    }

    if (formData.max_members < 2) {
      newErrors.max_members = 'Group must allow at least 2 members';
    } else if (formData.max_members > 50) {
      newErrors.max_members = 'Group cannot have more than 50 members';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreate = async () => {
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const result = await StudyGroupsService.createGroup({
        ...formData,
        name: formData.name.trim(),
        description: formData.description.trim() || undefined
      });

      if (result.error) {
        Alert.alert('Error', result.error);
      } else {
        Alert.alert(
          'Success',
          'Study group created successfully!',
          [
            {
              text: 'OK',
              onPress: () => {
                resetForm();
                onClose();
                onGroupCreated();
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Error creating group:', error);
      Alert.alert('Error', 'Failed to create study group');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      resetForm();
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose} disabled={loading}>
            <Text style={[styles.cancelButton, loading && styles.disabledText]}>
              Cancel
            </Text>
          </TouchableOpacity>
          <Text style={styles.title}>Create Study Group</Text>
          <TouchableOpacity 
            onPress={handleCreate} 
            disabled={loading}
            style={[styles.createButton, loading && styles.disabledButton]}
          >
            {loading ? (
              <ActivityIndicator size="small" color={colors.surface} />
            ) : (
              <Text style={[styles.createButtonText, loading && styles.disabledText]}>
                Create
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Group Name */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Group Name *</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Enter group name"
              placeholderTextColor={colors.textSecondary}
              maxLength={50}
              editable={!loading}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Description */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.textArea, errors.description && styles.inputError]}
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              placeholder="Describe what this group is about..."
              placeholderTextColor={colors.textSecondary}
              multiline
              numberOfLines={4}
              maxLength={200}
              editable={!loading}
            />
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
          </View>

          {/* Subject */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Subject *</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.subjectScroll}
            >
              {SUBJECTS.map((subject) => (
                <TouchableOpacity
                  key={subject}
                  style={[
                    styles.subjectChip,
                    formData.subject === subject && styles.subjectChipSelected
                  ]}
                  onPress={() => setFormData({ ...formData, subject })}
                  disabled={loading}
                >
                  <Text style={[
                    styles.subjectChipText,
                    formData.subject === subject && styles.subjectChipTextSelected
                  ]}>
                    {subject}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            {errors.subject && <Text style={styles.errorText}>{errors.subject}</Text>}
          </View>

          {/* Privacy Level */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Privacy</Text>
            <View style={styles.privacyContainer}>
              <TouchableOpacity
                style={[
                  styles.privacyButton,
                  formData.privacy_level === 'public' && styles.privacyButtonSelected
                ]}
                onPress={() => setFormData({ ...formData, privacy_level: 'public' })}
                disabled={loading}
              >
                <Text style={[
                  styles.privacyButtonText,
                  formData.privacy_level === 'public' && styles.privacyButtonTextSelected
                ]}>
                  🌐 Public
                </Text>
                <Text style={styles.privacyDescription}>
                  Anyone can find and join
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.privacyButton,
                  formData.privacy_level === 'private' && styles.privacyButtonSelected
                ]}
                onPress={() => setFormData({ ...formData, privacy_level: 'private' })}
                disabled={loading}
              >
                <Text style={[
                  styles.privacyButtonText,
                  formData.privacy_level === 'private' && styles.privacyButtonTextSelected
                ]}>
                  🔒 Private
                </Text>
                <Text style={styles.privacyDescription}>
                  Invite only
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Max Members */}
          <View style={styles.formGroup}>
            <Text style={styles.label}>Maximum Members</Text>
            <View style={styles.memberCountContainer}>
              <TouchableOpacity
                style={styles.memberCountButton}
                onPress={() => setFormData({ 
                  ...formData, 
                  max_members: Math.max(2, formData.max_members - 1) 
                })}
                disabled={loading || formData.max_members <= 2}
              >
                <Text style={styles.memberCountButtonText}>-</Text>
              </TouchableOpacity>
              
              <Text style={styles.memberCountText}>{formData.max_members}</Text>
              
              <TouchableOpacity
                style={styles.memberCountButton}
                onPress={() => setFormData({ 
                  ...formData, 
                  max_members: Math.min(50, formData.max_members + 1) 
                })}
                disabled={loading || formData.max_members >= 50}
              >
                <Text style={styles.memberCountButtonText}>+</Text>
              </TouchableOpacity>
            </View>
            {errors.max_members && <Text style={styles.errorText}>{errors.max_members}</Text>}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  cancelButton: {
    fontSize: 16,
    color: colors.primary,
  },
  createButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  createButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: colors.disabled,
  },
  disabledText: {
    color: colors.textSecondary,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  formGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  textArea: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.surface,
    height: 100,
    textAlignVertical: 'top',
  },
  inputError: {
    borderColor: colors.error,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    marginTop: 4,
  },
  subjectScroll: {
    flexGrow: 0,
  },
  subjectChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
  },
  subjectChipSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  subjectChipText: {
    fontSize: 14,
    color: colors.text,
  },
  subjectChipTextSelected: {
    color: colors.surface,
    fontWeight: '600',
  },
  privacyContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  privacyButton: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  privacyButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  privacyButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  privacyButtonTextSelected: {
    color: colors.surface,
  },
  privacyDescription: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  memberCountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  memberCountButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberCountButtonText: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.surface,
  },
  memberCountText: {
    fontSize: 24,
    fontWeight: '600',
    color: colors.text,
    minWidth: 40,
    textAlign: 'center',
  },
});
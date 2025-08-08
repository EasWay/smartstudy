import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context';
import { DatabaseService } from '../../services/supabase/database';
import AuthInput from '../../components/auth/AuthInput';
import AuthButton from '../../components/auth/AuthButton';
import { GRADE_LEVELS, SUBJECTS, UpdateProfileData } from '../../types/profile';

interface EditProfileScreenProps {
  navigation: any;
}

export default function EditProfileScreen({ navigation }: EditProfileScreenProps) {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    username: user?.username || '',
    fullName: user?.fullName || '',
    school: user?.school || '',
    gradeLevel: user?.gradeLevel || '',
    subjectsOfInterest: user?.subjectsOfInterest || [],
    avatarUrl: user?.avatarUrl || null,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update form data when user data changes (e.g., after refresh)
  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username || '',
        fullName: user.fullName || '',
        school: user.school || '',
        gradeLevel: user.gradeLevel || '',
        subjectsOfInterest: user.subjectsOfInterest || [],
        avatarUrl: user.avatarUrl || null,
      });
    }
  }, [user]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username.trim()) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    }

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!formData.school.trim()) {
      newErrors.school = 'School is required';
    }

    if (!formData.gradeLevel) {
      newErrors.gradeLevel = 'Grade level is required';
    }

    if (formData.subjectsOfInterest.length === 0) {
      newErrors.subjectsOfInterest = 'Please select at least one subject';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'User not found');
      return;
    }

    setLoading(true);

    try {
      const updateData: UpdateProfileData = {
        username: formData.username.trim(),
        full_name: formData.fullName.trim(),
        school: formData.school.trim(),
        grade_level: formData.gradeLevel,
        subjects_of_interest: formData.subjectsOfInterest,
        avatar_url: formData.avatarUrl || undefined,
      };

      const { data, error } = await DatabaseService.updateProfile(user.id, updateData);

      if (error) {
        Alert.alert('Error', error.message);
        return;
      }

      // Refresh user data in context
      await refreshUser();

      Alert.alert('Success', 'Profile updated successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      console.error('Update profile error:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      // Request permission
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (permissionResult.granted === false) {
        Alert.alert('Permission Required', 'Permission to access camera roll is required!');
        return;
      }

      setImageLoading(true);

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // For now, just store the local URI
        // In a production app, you'd upload to Supabase storage
        setFormData(prev => ({
          ...prev,
          avatarUrl: result.assets[0].uri
        }));
      }
    } catch (error) {
      console.error('Image picker error:', error);
      Alert.alert('Error', 'Failed to pick image');
    } finally {
      setImageLoading(false);
    }
  };

  const toggleSubject = (subject: string) => {
    setFormData(prev => ({
      ...prev,
      subjectsOfInterest: prev.subjectsOfInterest.includes(subject)
        ? prev.subjectsOfInterest.filter(s => s !== subject)
        : [...prev.subjectsOfInterest, subject]
    }));
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarContainer}>
            {imageLoading ? (
              <ActivityIndicator size="large" color={Colors.primary} />
            ) : formData.avatarUrl ? (
              <Image source={{ uri: formData.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarPlaceholderText}>
                  {formData.fullName ? formData.fullName.charAt(0).toUpperCase() : 'U'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={pickImage} style={styles.changePhotoButton}>
            <Text style={styles.changePhotoText}>Change Photo</Text>
          </TouchableOpacity>
        </View>

        {/* Form Fields */}
        <View style={styles.formSection}>
          <AuthInput
            label="Username"
            value={formData.username}
            onChangeText={(text) => setFormData(prev => ({ ...prev, username: text }))}
            error={errors.username}
            placeholder="Enter your username"
          />

          <AuthInput
            label="Full Name"
            value={formData.fullName}
            onChangeText={(text) => setFormData(prev => ({ ...prev, fullName: text }))}
            error={errors.fullName}
            placeholder="Enter your full name"
          />

          <AuthInput
            label="School"
            value={formData.school}
            onChangeText={(text) => setFormData(prev => ({ ...prev, school: text }))}
            error={errors.school}
            placeholder="Enter your school name"
          />

          {/* Grade Level Picker */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Grade Level</Text>
            <View style={styles.scrollWrapper}>
              <ScrollView
                horizontal={true}
                showsHorizontalScrollIndicator={false}
                style={styles.horizontalScrollView}
                contentContainerStyle={styles.horizontalScrollContent}
                scrollEnabled={true}
                bounces={false}
                decelerationRate="fast"
                scrollEventThrottle={16}
                disableIntervalMomentum={true}
                snapToAlignment="start"
              >
                {GRADE_LEVELS.map((grade, index) => (
                  <TouchableOpacity
                    key={grade}
                    style={[
                      styles.gradeChip,
                      formData.gradeLevel === grade && styles.gradeChipSelected
                    ]}
                    onPress={() => setFormData(prev => ({ ...prev, gradeLevel: grade }))}
                  >
                    <Text style={[
                      styles.gradeChipText,
                      formData.gradeLevel === grade && styles.gradeChipTextSelected
                    ]}>
                      {grade}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
            {errors.gradeLevel && <Text style={styles.errorText}>{errors.gradeLevel}</Text>}
          </View>

          {/* Subjects of Interest */}
          <View style={styles.fieldContainer}>
            <Text style={styles.fieldLabel}>Subjects of Interest</Text>
            <View style={styles.subjectsContainer}>
              {SUBJECTS.map((subject) => (
                <TouchableOpacity
                  key={subject}
                  style={[
                    styles.subjectChip,
                    formData.subjectsOfInterest.includes(subject) && styles.subjectChipSelected
                  ]}
                  onPress={() => toggleSubject(subject)}
                >
                  <Text style={[
                    styles.subjectChipText,
                    formData.subjectsOfInterest.includes(subject) && styles.subjectChipTextSelected
                  ]}>
                    {subject}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {errors.subjectsOfInterest && <Text style={styles.errorText}>{errors.subjectsOfInterest}</Text>}
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <AuthButton
            title="Save Changes"
            onPress={handleSave}
            loading={loading}
            style={styles.saveButton}
          />

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarContainer: {
    marginBottom: 12,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: Colors.primaryText,
  },
  changePhotoButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  changePhotoText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  formSection: {
    marginBottom: 32,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primaryText,
    marginBottom: 8,
  },
  scrollWrapper: {
    marginBottom: 12,
  },
  horizontalScrollView: {
    height: 60,
    backgroundColor: 'transparent',
  },
  horizontalScrollContent: {
    paddingLeft: 16,
    paddingRight: 16,
    alignItems: 'center',
    paddingVertical: 8,
  },
  gradeChip: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 22,
    marginRight: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    minWidth: 100,
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  gradeChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
    transform: [{ scale: 1.05 }],
  },
  gradeChipText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  gradeChipTextSelected: {
    color: Colors.primaryText,
    fontWeight: '700',
    letterSpacing: 0.5,
  },

  subjectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  subjectChip: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    margin: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  subjectChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  subjectChipText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  subjectChipTextSelected: {
    color: Colors.primaryText,
    fontWeight: '600',
  },
  errorText: {
    color: Colors.error,
    fontSize: 12,
    marginTop: 4,
  },
  buttonContainer: {
    marginBottom: 32,
  },
  saveButton: {
    marginBottom: 12,
  },
  cancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: Colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
});
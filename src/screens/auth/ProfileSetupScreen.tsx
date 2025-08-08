import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    KeyboardAvoidingView,
    Platform,
    Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { Colors } from '../../constants/colors';
import { CreateProfileData, GRADE_LEVELS, SUBJECTS, GradeLevel, Subject } from '../../types/profile';
import { DatabaseService } from '../../services/supabase/database';
import { DatabaseSetup } from '../../services/supabase/setup';
import { useAuth } from '../../context';


interface ProfileSetupForm {
    username: string;
    fullName: string;
    school: string;
    gradeLevel: GradeLevel | '';
    subjectsOfInterest: string[];
}

interface ProfileSetupFormErrors {
    username?: string;
    fullName?: string;
    school?: string;
    gradeLevel?: string;
    subjectsOfInterest?: string;
}

export default function ProfileSetupScreen() {
    const { user, refreshUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [dbStatus, setDbStatus] = useState<string>('Checking database...');
    const [formData, setFormData] = useState<ProfileSetupForm>({
        username: user?.username || '',
        fullName: user?.fullName || '',
        school: '',
        gradeLevel: '',
        subjectsOfInterest: [],
    });
    const [errors, setErrors] = useState<ProfileSetupFormErrors>({});

    // Check database status on component mount
    useEffect(() => {
        async function checkDatabase() {
            try {
                const connectionTest = await DatabaseService.testConnection();
                if (connectionTest.connected) {
                    setDbStatus('Database connected ✅');
                } else {
                    setDbStatus('Database connection failed ❌');
                }
            } catch (error) {
                setDbStatus('Database error ❌');
            }
        }
        checkDatabase();
    }, []);


    const validateForm = (): boolean => {
        const newErrors: ProfileSetupFormErrors = {};

        if (!formData.username.trim()) {
            newErrors.username = 'Username is required';
        } else if (formData.username.length < 3) {
            newErrors.username = 'Username must be at least 3 characters';
        } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
            newErrors.username = 'Username can only contain letters, numbers, and underscores';
        }

        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Full name is required';
        }

        if (!formData.school.trim()) {
            newErrors.school = 'School name is required';
        }

        if (!formData.gradeLevel) {
            newErrors.gradeLevel = 'Please select your grade level';
        }

        if (formData.subjectsOfInterest.length === 0) {
            newErrors.subjectsOfInterest = 'Please select at least one subject of interest';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleCreateProfile = async () => {
        if (!validateForm() || !user) return;

        setLoading(true);
        try {
            const profileData: CreateProfileData = {
                username: formData.username,
                full_name: formData.fullName,
                school: formData.school,
                grade_level: formData.gradeLevel as string,
                subjects_of_interest: formData.subjectsOfInterest,
            };

            console.log('Creating profile for user:', user.id);
            console.log('Profile data:', profileData);

            const { data, error } = await DatabaseService.createProfile(user.id, profileData);

            if (error) {
                console.error('Profile creation error:', error);
                Alert.alert('Profile Setup Failed', error.message);
                return;
            }

            console.log('Profile created successfully:', data);

            // Update status to show success
            setDbStatus('Profile created! Redirecting to main app... ✅');

            // Refresh the user state to trigger navigation check
            await refreshUser();

            // The AppNavigator should now detect the completed profile
            // and automatically navigate to the main app
            console.log('Profile setup completed, navigation should happen automatically');
        } catch (error) {
            console.error('Unexpected error during profile creation:', error);
            Alert.alert('Error', 'An unexpected error occurred. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const updateFormData = (field: keyof ProfileSetupForm, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        // Clear error when user starts typing/selecting
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const toggleSubject = (subject: string) => {
        const currentSubjects = formData.subjectsOfInterest;
        const isSelected = currentSubjects.includes(subject);

        if (isSelected) {
            updateFormData('subjectsOfInterest', currentSubjects.filter(s => s !== subject));
        } else {
            updateFormData('subjectsOfInterest', [...currentSubjects, subject]);
        }
    };

    return (
        <KeyboardAvoidingView
            style={styles.container}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.scrollContent}>
                <View style={styles.header}>
                    <Text style={styles.title}>Complete Your Profile</Text>
                    <Text style={styles.subtitle}>Help us personalize your learning experience</Text>
                    <Text style={styles.dbStatus}>{dbStatus}</Text>
                </View>

                <View style={styles.form}>
                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Username</Text>
                        <TextInput
                            style={[styles.input, errors.username && styles.inputError]}
                            placeholder="Enter your username"
                            placeholderTextColor={Colors.placeholder}
                            value={formData.username}
                            onChangeText={(text) => updateFormData('username', text)}
                            autoCapitalize="none"
                            autoCorrect={false}
                        />
                        {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Full Name</Text>
                        <TextInput
                            style={[styles.input, errors.fullName && styles.inputError]}
                            placeholder="Enter your full name"
                            placeholderTextColor={Colors.placeholder}
                            value={formData.fullName}
                            onChangeText={(text) => updateFormData('fullName', text)}
                            autoCapitalize="words"
                        />
                        {errors.fullName && <Text style={styles.errorText}>{errors.fullName}</Text>}
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>School</Text>
                        <TextInput
                            style={[styles.input, errors.school && styles.inputError]}
                            placeholder="Enter your school name"
                            placeholderTextColor={Colors.placeholder}
                            value={formData.school}
                            onChangeText={(text) => updateFormData('school', text)}
                            autoCapitalize="words"
                        />
                        {errors.school && <Text style={styles.errorText}>{errors.school}</Text>}
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Grade Level</Text>
                        <View style={[styles.pickerContainer, errors.gradeLevel && styles.inputError]}>
                            <Picker
                                selectedValue={formData.gradeLevel}
                                onValueChange={(value: GradeLevel | '') => updateFormData('gradeLevel', value)}
                                style={styles.picker}
                            >
                                <Picker.Item label="Select your grade level" value="" />
                                {GRADE_LEVELS.map((grade) => (
                                    <Picker.Item key={grade} label={grade} value={grade} />
                                ))}
                            </Picker>
                        </View>
                        {errors.gradeLevel && <Text style={styles.errorText}>{errors.gradeLevel}</Text>}
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.label}>Subjects of Interest</Text>
                        <Text style={styles.helperText}>Select subjects you're interested in learning</Text>
                        <View style={styles.subjectsContainer}>
                            {SUBJECTS.map((subject) => (
                                <TouchableOpacity
                                    key={subject}
                                    style={[
                                        styles.subjectChip,
                                        formData.subjectsOfInterest.includes(subject) && styles.subjectChipSelected,
                                    ]}
                                    onPress={() => toggleSubject(subject)}
                                >
                                    <Text
                                        style={[
                                            styles.subjectChipText,
                                            formData.subjectsOfInterest.includes(subject) && styles.subjectChipTextSelected,
                                        ]}
                                    >
                                        {subject}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                        {errors.subjectsOfInterest && (
                            <Text style={styles.errorText}>{errors.subjectsOfInterest}</Text>
                        )}
                    </View>

                    <TouchableOpacity
                        style={[styles.createButton, loading && styles.createButtonDisabled]}
                        onPress={handleCreateProfile}
                        disabled={loading}
                    >
                        <Text style={styles.createButtonText}>
                            {loading ? 'Creating Profile...' : 'Complete Setup'}
                        </Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 20,
    },
    header: {
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 20,
        backgroundColor: Colors.background,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: Colors.primaryText,
        marginBottom: 6,
    },
    subtitle: {
        fontSize: 14,
        color: Colors.textSecondary,
        textAlign: 'center',
        lineHeight: 20,
    },
    form: {
        marginBottom: 32,
    },
    inputContainer: {
        marginBottom: 16,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: Colors.primaryText,
        marginBottom: 6,
    },
    helperText: {
        fontSize: 14,
        color: Colors.textSecondary,
        marginBottom: 12,
    },
    input: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        color: Colors.primaryText,
    },
    inputError: {
        borderColor: Colors.error,
    },
    pickerContainer: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 12,
        overflow: 'hidden',
    },
    picker: {
        color: Colors.primaryText,
    },
    subjectsContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
    },
    subjectChip: {
        backgroundColor: Colors.surface,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
        marginBottom: 8,
    },
    subjectChipSelected: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    subjectChipText: {
        fontSize: 14,
        color: Colors.primaryText,
    },
    subjectChipTextSelected: {
        color: Colors.background,
        fontWeight: '600',
    },
    errorText: {
        color: Colors.error,
        fontSize: 14,
        marginTop: 4,
    },
    createButton: {
        backgroundColor: Colors.primary,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        marginTop: 24,
    },
    createButtonDisabled: {
        opacity: 0.6,
    },
    createButtonText: {
        color: Colors.primaryText,
        fontSize: 16,
        fontWeight: 'bold',
    },
    dbStatus: {
        fontSize: 12,
        color: Colors.textSecondary,
        textAlign: 'center',
        marginTop: 8,
    },
});
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ScrollView } from 'react-native';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../context';
import { getUserDisplayName, getUserInitials } from '../../utils';

interface ProfileScreenProps {
  navigation: any;
}

export default function ProfileScreen({ navigation }: ProfileScreenProps) {
  const { user, signOut } = useAuth();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              console.log('Sign out completed');
            } catch (error) {
              console.error('Sign out failed:', error);
            }
          }
        }
      ]
    );
  };

  const displayName = getUserDisplayName(user);
  const initials = getUserInitials(user);

  const handleEditProfile = () => {
    navigation.navigate('EditProfile');
  };

  return (
    <View style={styles.container}>
      {user ? (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.profileHeader}>
            {user?.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials}</Text>
              </View>
            )}
            <Text style={styles.displayName}>{displayName}</Text>
            <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>

          {/* Common Profile Settings */}
          <View style={styles.settingsSection}>
            <Text style={styles.sectionTitle}>Settings</Text>
            <View style={styles.settingsList}>
              <TouchableOpacity style={styles.settingsItem}>
                <Text style={styles.settingsText}>Notifications</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingsItem}>
                <Text style={styles.settingsText}>Theme</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingsItem}>
                <Text style={styles.settingsText}>Language</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingsItem}>
                <Text style={styles.settingsText}>Privacy</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.settingsItem}>
                <Text style={styles.settingsText}>Help & Support</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.aboutSection}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.aboutText}>SmartStudy v1.0.0</Text>
            <Text style={styles.aboutText}>© 2025 SmartStudy Team</Text>
            <Text style={styles.aboutText}>Contact: support@smartstudy.com</Text>
          </View>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <View style={styles.centeredMessage}>
          <Text style={styles.centeredMessageText}>You are signed out.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  signOutButtonText: {
    color: Colors.primaryText,
    fontSize: 14,
    fontWeight: '600',
  },
  centeredMessageText: {
    color: Colors.textSecondary,
    fontSize: 18,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primaryText,
  },
  displayName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primaryText,
    textAlign: 'center',
    marginBottom: 8,
  },
  editButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    color: Colors.primaryText,
    fontSize: 14,
    fontWeight: '600',
  },
  settingsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primaryText,
    marginBottom: 12,
    marginTop: 24,
  },
  settingsList: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 8,
    paddingVertical: 8,
  },
  settingsItem: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  settingsText: {
    fontSize: 16,
    color: Colors.primaryText,
  },
  aboutSection: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  aboutText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 16,
  },
  centeredMessage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signOutButton: {
    backgroundColor: Colors.error,
    borderRadius: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
});


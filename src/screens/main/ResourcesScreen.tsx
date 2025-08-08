import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import ResourceList, { ResourceListRef } from '../../components/common/ResourceList';
import UploadModal from '../../components/resources/UploadModal';
import { Resource } from '../../types/resources';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useCustomAlert } from '../../components/common/CustomAlert';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../navigation/types';

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function ResourcesScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { showAlert, AlertComponent } = useCustomAlert();
  const [isUploadModalVisible, setUploadModalVisible] = useState(false);
  const resourceListRef = useRef<ResourceListRef>(null);

  const handleResourcePress = (resource: Resource) => {
    // Navigate directly to preview screen for automatic preview
    navigation.navigate('ResourcePreview', { resource });
  };

  const handleUploadSuccess = () => {
    console.log('Resource uploaded successfully, refreshing list...');
    if (resourceListRef.current) {
      resourceListRef.current.refreshResources();
    }
  };

  // Auto-refresh when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (resourceListRef.current) {
        resourceListRef.current.refreshResources();
      }
    }, [])
  );

  return (
    <View style={styles.container}>
      {/* Header with management and downloads buttons */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>What are we doing today?</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('Downloads')}
          >
            <Ionicons name="download-outline" size={24} color={Colors.primary} />
            <Text style={styles.headerButtonText}>Downloads</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('ResourceManagement')}
          >
            <Ionicons name="settings-outline" size={24} color={Colors.primary} />
            <Text style={styles.headerButtonText}>Manage</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ResourceList ref={resourceListRef} onResourcePress={handleResourcePress} />

      <TouchableOpacity
        style={styles.uploadButton}
        onPress={() => setUploadModalVisible(true)}
      >
        <Ionicons name="add" size={30} color={Colors.primaryText} />
      </TouchableOpacity>

      <UploadModal
        isVisible={isUploadModalVisible}
        onClose={() => setUploadModalVisible(false)}
        onUploadSuccess={handleUploadSuccess}
      />
      <AlertComponent />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primaryText,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.background,
    marginLeft: 8,
  },
  headerButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '600',
  },
  uploadButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: Colors.primary,
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

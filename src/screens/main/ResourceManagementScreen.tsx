import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/colors';
import { Resource } from '../../types/resources';
import { ResourceService } from '../../services/resources/resourceService';
import { useCustomAlert } from '../../components/common/CustomAlert';
import ResourceCard from '../../components/common/ResourceCard';
import { useAuth } from '../../context/AuthContext';

export default function ResourceManagementScreen() {
  const { user } = useAuth();
  const { showAlert, AlertComponent } = useCustomAlert();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedResources, setSelectedResources] = useState<Set<string>>(new Set());
  const [storageStats, setStorageStats] = useState({ used: 0, limit: 0, files: 0 });

  useEffect(() => {
    fetchUserResources();
    fetchStorageStats();
  }, []);

  const fetchUserResources = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const userResources = await ResourceService.getUserResources(user.id);
      setResources(userResources);
    } catch (error) {
      console.error('Error fetching user resources:', error);
      showAlert('Error', 'Failed to load your resources');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStorageStats = async () => {
    if (!user?.id) return;

    try {
      const stats = await ResourceService.getStorageStats(user.id);
      setStorageStats(stats);
    } catch (error) {
      console.error('Error fetching storage stats:', error);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    fetchUserResources();
    fetchStorageStats();
  };

  const handleDeleteResource = (resource: Resource) => {
    showAlert(
      'Delete Resource',
      `Are you sure you want to delete "${resource.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => confirmDeleteResource(resource.id)
        }
      ]
    );
  };

  const confirmDeleteResource = async (resourceId: string) => {
    try {
      await ResourceService.deleteResource(resourceId);
      setResources(prev => prev.filter(r => r.id !== resourceId));
      fetchStorageStats(); // Update storage stats
      // No success alert - just silent deletion
    } catch (error) {
      console.error('Error deleting resource:', error);
      showAlert('Error', 'Failed to delete resource');
    }
  };

  const handleBulkDelete = () => {
    if (selectedResources.size === 0) return;

    showAlert(
      'Delete Resources',
      `Are you sure you want to delete ${selectedResources.size} selected resource(s)? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All',
          style: 'destructive',
          onPress: confirmBulkDelete
        }
      ]
    );
  };

  const confirmBulkDelete = async () => {
    try {
      const resourceIds = Array.from(selectedResources);
      const result = await ResourceService.deleteMultipleResources(resourceIds);

      // Remove successfully deleted resources from the list
      setResources(prev => prev.filter(r => !result.success.includes(r.id)));

      // Clear selection and exit selection mode
      setSelectedResources(new Set());
      setSelectionMode(false);

      // Update storage stats
      fetchStorageStats();

      // Show result only if there were failures
      if (result.failed.length > 0) {
        showAlert(
          'Partial Success',
          `${result.success.length} resources deleted successfully. ${result.failed.length} failed to delete.`
        );
      }
      // No success alert for complete success - silent operation
    } catch (error) {
      console.error('Error in bulk delete:', error);
      showAlert('Error', 'Failed to delete resources');
    }
  };

  const toggleSelection = (resource: Resource) => {
    const newSelection = new Set(selectedResources);
    if (newSelection.has(resource.id)) {
      newSelection.delete(resource.id);
    } else {
      newSelection.add(resource.id);
    }
    setSelectedResources(newSelection);
  };

  const selectAll = () => {
    if (selectedResources.size === resources.length) {
      setSelectedResources(new Set());
    } else {
      setSelectedResources(new Set(resources.map(r => r.id)));
    }
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedResources(new Set());
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getStoragePercentage = () => {
    if (storageStats.limit === 0) return 0;
    return (storageStats.used / storageStats.limit) * 100;
  };

  const handleResourcePress = (resource: Resource) => {
    // Handle resource viewing/downloading
    showAlert(
      resource.title,
      `Type: ${resource.resourceType}\nSize: ${resource.fileSize ? formatBytes(resource.fileSize) : 'Unknown'}\nUploaded: ${new Date(resource.createdAt).toLocaleDateString()}`,
      [
        { text: 'View', onPress: () => console.log('View Resource') },
        { text: 'Download', onPress: () => console.log('Download Resource') },
        { text: 'Close', style: 'cancel' },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading your resources...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Storage Stats Header */}
      <View style={styles.storageHeader}>
        <Text style={styles.storageTitle}>Storage Usage</Text>
        <Text style={styles.storageText}>
          {formatBytes(storageStats.used)} / {formatBytes(storageStats.limit)} ({storageStats.files} files)
        </Text>
        <View style={styles.progressBarBackground}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${Math.min(getStoragePercentage(), 100)}%`,
                backgroundColor: getStoragePercentage() > 90 ? Colors.error : Colors.primary
              }
            ]}
          />
        </View>
      </View>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        {selectionMode ? (
          <>
            <TouchableOpacity onPress={exitSelectionMode} style={styles.actionButton}>
              <Ionicons name="close" size={24} color={Colors.textSecondary} />
              <Text style={styles.actionButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={selectAll} style={styles.actionButton}>
              <Ionicons
                name={selectedResources.size === resources.length ? "checkbox" : "square-outline"}
                size={24}
                color={Colors.primary}
              />
              <Text style={styles.actionButtonText}>
                {selectedResources.size === resources.length ? 'Deselect All' : 'Select All'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleBulkDelete}
              style={[styles.actionButton, selectedResources.size === 0 && styles.actionButtonDisabled]}
              disabled={selectedResources.size === 0}
            >
              <Ionicons name="trash" size={24} color={selectedResources.size > 0 ? Colors.error : Colors.textSecondary} />
              <Text style={[styles.actionButtonText, { color: selectedResources.size > 0 ? Colors.error : Colors.textSecondary }]}>
                Delete ({selectedResources.size})
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity onPress={() => setSelectionMode(true)} style={styles.actionButton}>
            <Ionicons name="checkmark-circle-outline" size={24} color={Colors.primary} />
            <Text style={styles.actionButtonText}>Select</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Resources List */}
      {resources.length === 0 ? (
        <View style={styles.centered}>
          <Ionicons name="folder-open-outline" size={64} color={Colors.textSecondary} />
          <Text style={styles.emptyText}>No resources uploaded yet</Text>
          <Text style={styles.emptySubtext}>Upload your first resource to get started</Text>
        </View>
      ) : (
        <FlatList
          data={resources}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ResourceCard
              resource={item}
              onPress={handleResourcePress}
              onDelete={handleDeleteResource}
              showDeleteButton={!selectionMode}
              selectionMode={selectionMode}
              isSelected={selectedResources.has(item.id)}
              onSelect={toggleSelection}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
            />
          }
        />
      )}
      <AlertComponent />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    color: Colors.secondaryText,
  },
  storageHeader: {
    backgroundColor: Colors.surface,
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  storageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primaryText,
    marginBottom: 8,
  },
  storageText: {
    fontSize: 14,
    color: Colors.secondaryText,
    marginBottom: 8,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: Colors.primaryText,
  },
  listContent: {
    padding: 16,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.secondaryText,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.secondaryText,
    marginTop: 8,
    textAlign: 'center',
  },
});
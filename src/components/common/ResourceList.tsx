import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TextInput, TouchableOpacity, RefreshControl } from 'react-native';
import { Resource } from '../../types/resources';
import ResourceCard from './ResourceCard';
import { Colors } from '../../constants/colors';
import { ResourceService } from '../../services/resources/resourceService';
import { Ionicons } from '@expo/vector-icons';

interface ResourceListProps {
  onResourcePress: (resource: Resource) => void;
}

export interface ResourceListRef {
  refreshResources: () => void;
}

const ResourceList = forwardRef<ResourceListRef, ResourceListProps>(
  (props: ResourceListProps, ref) => {
    const { onResourcePress } = props;
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [refreshing, setRefreshing] = useState(false); // New state for pull-to-refresh

  const fetchResources = async () => {
    setLoading(true);
    setRefreshing(true); // Set refreshing to true when fetching starts
    setError(null);
    try {
      const fetchedResources = await ResourceService.fetchResources(searchQuery);
      setResources(fetchedResources);
    } catch (err) {
      setError('Failed to load resources.');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false); // Set refreshing to false when fetching ends
    }
  };

  useImperativeHandle(ref, () => ({
    refreshResources: fetchResources,
  }));

  useEffect(() => {
    fetchResources();
  }, []);

  const handleSearch = () => {
    fetchResources();
  };

  const handleBookmarkToggle = async (resource: Resource) => {
    try {
      if (resource.isBookmarked) {
        await ResourceService.removeBookmark(resource.id);
      } else {
        await ResourceService.addBookmark(resource.id);
      }
      // Optimistically update UI
      setResources(prevResources =>
        prevResources.map(r =>
          r.id === resource.id ? { ...r, isBookmarked: !r.isBookmarked } : r
        )
      );
    } catch (err) {
      console.error('Failed to toggle bookmark:', err);
      // Revert UI on error or show alert
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading resources...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity onPress={fetchResources} style={styles.retryButton}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search resources..."
          placeholderTextColor={Colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
          <Ionicons name="search" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>
      {resources.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No resources found.</Text>
        </View>
      ) : (
        <FlatList
          data={resources}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ResourceCard
              resource={item}
              onPress={onResourcePress}
              onBookmarkToggle={handleBookmarkToggle}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={fetchResources}
              tintColor={Colors.primary}
            />
          }
        />
      )}
    </View>
  );
  }
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    color: Colors.textSecondary,
  },
  errorText: {
    color: Colors.error,
    fontSize: 16,
    marginBottom: 10,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  retryButtonText: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    margin: 16,
    paddingHorizontal: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: Colors.primary,
  },
  searchButton: {
    padding: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 16,
  },
});

export default ResourceList;

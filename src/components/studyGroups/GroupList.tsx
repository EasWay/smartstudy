import React, { useState, useEffect } from 'react';
import { 
  View, 
  FlatList, 
  RefreshControl, 
  StyleSheet, 
  Text,
  ActivityIndicator 
} from 'react-native';
import { StudyGroup, GroupSearchFilters } from '../../types/studyGroups';
import { StudyGroupsService } from '../../services/studyGroups';
import { GroupCard } from './GroupCard';
import { ErrorState } from '../common/ErrorState';
import { colors } from '../../constants/colors';

interface GroupListProps {
  filters?: GroupSearchFilters;
  onGroupPress: (group: StudyGroup) => void;
  onJoinGroup?: (groupId: string) => void;
  showJoinButton?: boolean;
  userGroupIds?: string[]; // IDs of groups the user is already a member of
  groups?: StudyGroup[]; // Optional: provide groups directly instead of fetching
  isMyGroupsView?: boolean; // Whether this is showing user's groups
}

export const GroupList: React.FC<GroupListProps> = ({
  filters,
  onGroupPress,
  onJoinGroup,
  showJoinButton = false,
  userGroupIds = [],
  groups: providedGroups,
  isMyGroupsView = false
}) => {
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadGroups = async (isRefresh = false) => {
    // If groups are provided directly, use them instead of fetching
    if (providedGroups) {
      setGroups(providedGroups);
      setLoading(false);
      setRefreshing(false);
      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await StudyGroupsService.getPublicGroups(filters);
      
      if (response.error) {
        setError(response.error);
      } else {
        setGroups(response.data);
      }
    } catch (err) {
      setError('Failed to load study groups');
      console.error('Error loading groups:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (providedGroups) {
      setGroups(providedGroups);
      setLoading(false);
    } else {
      loadGroups();
    }
  }, [filters, providedGroups]);

  const handleRefresh = () => {
    loadGroups(true);
  };

  const handleJoinGroup = async (groupId: string) => {
    if (!onJoinGroup) return;

    try {
      await onJoinGroup(groupId);
      // Refresh the list to update member counts
      loadGroups(true);
    } catch (err) {
      console.error('Error joining group:', err);
    }
  };

  const renderGroupCard = ({ item }: { item: StudyGroup }) => {
    const isUserMember = isMyGroupsView || userGroupIds.includes(item.id);
    
    return (
      <GroupCard
        group={item}
        onPress={onGroupPress}
        onJoin={handleJoinGroup}
        showJoinButton={showJoinButton}
        isUserMember={isUserMember}
        isMyGroupsView={isMyGroupsView}
      />
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>
        {filters?.search_query 
          ? 'No study groups found matching your search'
          : 'No study groups available'
        }
      </Text>
      <Text style={styles.emptyStateSubtext}>
        {filters?.search_query 
          ? 'Try adjusting your search terms'
          : 'Be the first to create a study group!'
        }
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading study groups...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={() => loadGroups()}
        style={styles.errorContainer}
      />
    );
  }

  return (
    <FlatList
      data={groups}
      renderItem={renderGroupCard}
      keyExtractor={(item) => item.id}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
        />
      }
      ListEmptyComponent={renderEmptyState}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={groups.length === 0 ? styles.emptyContainer : styles.container}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    // Remove padding for WhatsApp-like appearance
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    margin: 16,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
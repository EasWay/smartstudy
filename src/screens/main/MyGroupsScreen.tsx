import React from 'react';
import { 
  View, 
  FlatList, 
  RefreshControl, 
  StyleSheet, 
  Text,
  ActivityIndicator 
} from 'react-native';
import { StudyGroup } from '../../types/studyGroups';
import { GroupMembershipCard } from '../../components/studyGroups/GroupMembershipCard';
import { ErrorState } from '../../components/common/ErrorState';
import { useStudyGroups } from '../../hooks/useStudyGroups';
import { colors } from '../../constants/colors';

export default function MyGroupsScreen() {
  const {
    userGroups,
    loading,
    refreshing,
    error,
    leaveGroup,
    refresh
  } = useStudyGroups();

  const handleGroupPress = (group: StudyGroup) => {
    // TODO: Navigate to group detail/chat screen
    console.log('My group pressed:', group.name);
  };

  const renderGroupCard = ({ item }: { item: StudyGroup }) => (
    <GroupMembershipCard
      group={item}
      onLeave={leaveGroup}
      onPress={handleGroupPress}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateIcon}>👥</Text>
      <Text style={styles.emptyStateText}>
        You haven't joined any study groups yet
      </Text>
      <Text style={styles.emptyStateSubtext}>
        Browse available groups and join ones that match your interests
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading your groups...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <ErrorState
        message={error}
        onRetry={refresh}
        style={styles.errorContainer}
      />
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={userGroups}
        renderItem={renderGroupCard}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={userGroups.length === 0 ? styles.emptyContainer : styles.container}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: 16,
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
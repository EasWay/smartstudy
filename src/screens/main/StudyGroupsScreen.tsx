import React, { useState, useRef } from 'react';
import { View, StyleSheet, Text, TextInput, TouchableOpacity, ScrollView, RefreshControl, StatusBar, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { StudyGroup, GroupSearchFilters } from '../../types/studyGroups';
import { GroupList } from '../../components/studyGroups';
import { CreateGroupModal } from '../../components/studyGroups/CreateGroupModal';
import { useStudyGroups } from '../../hooks/useStudyGroups';
import { useToast } from '../../context/ToastContext';
import { 
  getJoinSuccessMessage, 
  getLeaveSuccessMessage, 
  getJoinErrorMessage, 
  getLeaveErrorMessage,
} from '../../utils/toastMessages';
import { colors } from '../../constants/colors';
import { StudyGroupsStackParamList } from '../../types/navigation';

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

export default function StudyGroupsScreen() {
  const navigation = useNavigation<StackNavigationProp<StudyGroupsStackParamList>>();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'my'>('all');
  const [currentPage, setCurrentPage] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const { width: screenWidth } = Dimensions.get('window');

  // Create filters object for the hook
  const filters: GroupSearchFilters = {};
  if (searchQuery.trim()) filters.search_query = searchQuery.trim();
  if (selectedSubject) filters.subject = selectedSubject;

  const {
    userGroups,
    userGroupIds,
    refreshing,
    joinGroup,
    leaveGroup,
    refresh
  } = useStudyGroups(filters);

  const { showSuccess, showError } = useToast();

  const handleGroupPress = (group: StudyGroup) => {
    navigation.navigate('GroupChat', { groupId: group.id });
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      const result = await joinGroup(groupId);

      if (result.success) {
        showSuccess(getJoinSuccessMessage());
      } else {
        showError(result.error || getJoinErrorMessage());
      }
    } catch (error) {
      console.error('Error joining group:', error);
      showError(getJoinErrorMessage());
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    try {
      const result = await leaveGroup(groupId);

      if (result.success) {
        showSuccess(getLeaveSuccessMessage());
      } else {
        showError(result.error || getLeaveErrorMessage());
      }
    } catch (error) {
      console.error('Error leaving group:', error);
      showError(getLeaveErrorMessage());
    }
  };

  const handleGroupCreated = () => {
    setShowCreateModal(false);
    // The hook will automatically refresh the data
  };

  const handleTabPress = (tab: 'all' | 'my') => {
    const pageIndex = tab === 'all' ? 0 : 1;
    setActiveTab(tab);
    setCurrentPage(pageIndex);
    scrollViewRef.current?.scrollTo({ x: pageIndex * screenWidth, animated: true });
  };

  const handleScroll = (event: any) => {
    const scrollX = event.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(scrollX / screenWidth);
    
    if (pageIndex !== currentPage) {
      setCurrentPage(pageIndex);
      setActiveTab(pageIndex === 0 ? 'all' : 'my');
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor={colors.background} barStyle="light-content" />
      
      {/* Compact Controls */}
      <View style={styles.controlsContainer}>
        {/* Search Bar and Create Button */}
        <View style={styles.topRow}>
          <View style={styles.searchContainer}>
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              style={styles.searchInput}
              placeholder="Search groups..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          <TouchableOpacity 
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
          >
            <Text style={styles.createButtonText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* Subject Filter */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.subjectScrollView}
          contentContainerStyle={styles.subjectContainer}
        >
          {SUBJECTS.map((subject) => (
            <TouchableOpacity
              key={subject}
              style={[
                styles.subjectChip,
                selectedSubject === subject && styles.subjectChipSelected
              ]}
              onPress={() => setSelectedSubject(selectedSubject === subject ? '' : subject)}
            >
              <Text style={[
                styles.subjectChipText,
                selectedSubject === subject && styles.subjectChipTextSelected
              ]}>
                {subject}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Tab Toggle */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'all' && styles.tabButtonActive]}
            onPress={() => handleTabPress('all')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'all' && styles.tabButtonTextActive]}>
              All Groups
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'my' && styles.tabButtonActive]}
            onPress={() => handleTabPress('my')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'my' && styles.tabButtonTextActive]}>
              My Groups ({userGroups.length})
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Swipeable Content */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={styles.pagerView}
        contentContainerStyle={styles.pagerContent}
      >
        {/* All Groups Page */}
        <View style={[styles.pageContainer, { width: screenWidth }]}>
          <GroupList
            filters={filters}
            onGroupPress={handleGroupPress}
            onJoinGroup={handleJoinGroup}
            showJoinButton={true}
            userGroupIds={userGroupIds}
          />
        </View>

        {/* My Groups Page */}
        <View style={[styles.pageContainer, { width: screenWidth }]}>
          {userGroups.length > 0 ? (
            <GroupList
              filters={{}}
              onGroupPress={handleGroupPress}
              onJoinGroup={handleLeaveGroup}
              showJoinButton={true}
              userGroupIds={[]}
              groups={userGroups}
              isMyGroupsView={true}
            />
          ) : (
            <ScrollView
              contentContainerStyle={styles.emptyMyGroupsContainer}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={refresh}
                  colors={[colors.primary]}
                  tintColor={colors.primary}
                />
              }
            >
              <View style={styles.emptyMyGroups}>
                <Text style={styles.emptyMyGroupsText}>No groups yet</Text>
                <Text style={styles.emptyMyGroupsSubtext}>Swipe right to "All Groups" to find groups to join</Text>
              </View>
            </ScrollView>
          )}
        </View>
      </ScrollView>

      {/* Create Group Modal */}
      <CreateGroupModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onGroupCreated={handleGroupCreated}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  controlsContainer: {
    paddingTop: 40,
    paddingBottom: 8,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 12,
    height: 36,
    borderWidth: 1,
    borderColor: colors.border,
  },
  createButton: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  createButtonText: {
    color: colors.white,
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 30,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
    color: colors.textSecondary,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    paddingVertical: 0,
  },
  subjectScrollView: {
    marginBottom: 8,
  },
  subjectContainer: {
    paddingHorizontal: 16,
  },
  subjectChip: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  subjectChipSelected: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  subjectChipText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: '500',
  },
  subjectChipTextSelected: {
    color: colors.white,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 18,
  },
  tabButtonActive: {
    backgroundColor: colors.primary,
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  tabButtonTextActive: {
    color: colors.white,
    fontWeight: '600',
  },
  pagerView: {
    flex: 1,
  },
  pagerContent: {
    flexDirection: 'row',
  },
  pageContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  emptyMyGroups: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyMyGroupsText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyMyGroupsSubtext: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  emptyMyGroupsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
});
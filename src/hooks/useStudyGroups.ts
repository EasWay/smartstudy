import { useState, useEffect, useCallback, useMemo } from 'react';
import { StudyGroup, GroupSearchFilters } from '../types/studyGroups';
import { StudyGroupsService } from '../services/studyGroups';

export const useStudyGroups = (filters?: GroupSearchFilters) => {
  const [groups, setGroups] = useState<StudyGroup[]>([]);
  const [userGroups, setUserGroups] = useState<StudyGroup[]>([]);
  const [userGroupIds, setUserGroupIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize filters to prevent unnecessary re-renders
  const memoizedFilters = useMemo(() => filters, [
    filters?.subject,
    filters?.search_query,
    filters?.privacy_level
  ]);

  const loadPublicGroups = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await StudyGroupsService.getPublicGroups(memoizedFilters);
      
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
  }, [memoizedFilters]);

  const loadUserGroups = useCallback(async () => {
    try {
      const response = await StudyGroupsService.getUserGroups();
      
      if (!response.error) {
        setUserGroups(response.data);
        setUserGroupIds(response.data.map(group => group.id));
      }
    } catch (err) {
      console.error('Error loading user groups:', err);
    }
  }, []);

  const joinGroup = useCallback(async (groupId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await StudyGroupsService.joinGroup(groupId);
      
      if (result.success) {
        // Refresh both lists
        await Promise.all([
          loadUserGroups(),
          loadPublicGroups(true)
        ]);
      }
      
      return result;
    } catch (error) {
      console.error('Error joining group:', error);
      return { success: false, error: 'Failed to join group' };
    }
  }, [loadUserGroups, loadPublicGroups]);

  const leaveGroup = useCallback(async (groupId: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const result = await StudyGroupsService.leaveGroup(groupId);
      
      if (result.success) {
        // Refresh both lists
        await Promise.all([
          loadUserGroups(),
          loadPublicGroups(true)
        ]);
      }
      
      return result;
    } catch (error) {
      console.error('Error leaving group:', error);
      return { success: false, error: 'Failed to leave group' };
    }
  }, [loadUserGroups, loadPublicGroups]);

  const createGroup = useCallback(async (groupData: any): Promise<{ success: boolean; error?: string; data?: StudyGroup }> => {
    try {
      const result = await StudyGroupsService.createGroup(groupData);
      
      if (!result.error && result.data) {
        // Refresh both lists
        await Promise.all([
          loadUserGroups(),
          loadPublicGroups(true)
        ]);
        
        return { success: true, data: result.data };
      }
      
      return { success: false, error: result.error };
    } catch (error) {
      console.error('Error creating group:', error);
      return { success: false, error: 'Failed to create group' };
    }
  }, [loadUserGroups, loadPublicGroups]);

  const checkMembership = useCallback(async (groupId: string) => {
    try {
      return await StudyGroupsService.isGroupMember(groupId);
    } catch (error) {
      console.error('Error checking membership:', error);
      return { isMember: false };
    }
  }, []);

  const refresh = useCallback(() => {
    loadPublicGroups(true);
    loadUserGroups();
  }, [loadPublicGroups, loadUserGroups]);

  // Use separate useEffect for initial load to prevent infinite loops
  useEffect(() => {
    let mounted = true;
    
    const initialLoad = async () => {
      if (mounted) {
        await Promise.all([
          loadPublicGroups(),
          loadUserGroups()
        ]);
      }
    };

    initialLoad();

    return () => {
      mounted = false;
    };
  }, [memoizedFilters]); // Only depend on memoized filters

  return {
    // Data
    groups,
    userGroups,
    userGroupIds,
    
    // State
    loading,
    refreshing,
    error,
    
    // Actions
    joinGroup,
    leaveGroup,
    createGroup,
    checkMembership,
    refresh,
    loadUserGroups,
  };
};
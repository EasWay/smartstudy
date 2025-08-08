import { supabase } from '../supabase/client';
import { 
  StudyGroup, 
  GroupMember, 
  GroupMessage, 
  CreateGroupData, 
  GroupSearchFilters,
  StudyGroupsResponse,
  GroupMembersResponse,
  GroupMessagesResponse
} from '../../types/studyGroups';

export class StudyGroupsService {
  /**
   * Get all public study groups with member counts
   */
  static async getPublicGroups(filters?: GroupSearchFilters): Promise<StudyGroupsResponse> {
    try {
      let query = supabase
        .from('study_groups')
        .select(`
          *,
          group_members(count)
        `)
        .eq('privacy_level', 'public')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters?.subject) {
        query = query.eq('subject', filters.subject);
      }

      if (filters?.search_query) {
        query = query.or(`name.ilike.%${filters.search_query}%,description.ilike.%${filters.search_query}%`);
      }

      const { data, error, count } = await query;

      if (error) {
        console.error('Error fetching public groups:', error);
        return { data: [], count: 0, error: error.message };
      }

      // Transform data to include member counts
      const transformedData: StudyGroup[] = (data || []).map(group => ({
        ...group,
        current_member_count: Array.isArray(group.group_members) ? group.group_members.length : 0
      }));

      return { data: transformedData, count: count || 0 };
    } catch (error) {
      console.error('Error in getPublicGroups:', error);
      return { data: [], count: 0, error: 'Failed to fetch study groups' };
    }
  }

  /**
   * Get groups that the current user is a member of
   */
  static async getUserGroups(): Promise<StudyGroupsResponse> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: [], count: 0, error: 'User not authenticated' };
      }

      const { data, error, count } = await supabase
        .from('group_members')
        .select(`
          study_groups(
            *,
            group_members(count)
          )
        `)
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false });

      if (error) {
        console.error('Error fetching user groups:', error);
        return { data: [], count: 0, error: error.message };
      }

      // Transform data to include member counts
      const transformedData: StudyGroup[] = (data || [])
        .filter(item => item.study_groups)
        .map(item => {
          const group = item.study_groups as any;
          return {
            ...group,
            current_member_count: Array.isArray(group.group_members) ? group.group_members.length : 0
          };
        });

      return { data: transformedData, count: count || 0 };
    } catch (error) {
      console.error('Error in getUserGroups:', error);
      return { data: [], count: 0, error: 'Failed to fetch user groups' };
    }
  }

  /**
   * Create a new study group
   */
  static async createGroup(groupData: CreateGroupData): Promise<{ data: StudyGroup | null; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'User not authenticated' };
      }

      const { data, error } = await supabase
        .from('study_groups')
        .insert({
          ...groupData,
          created_by: user.id
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating group:', error);
        return { data: null, error: error.message };
      }

      return { data: data as StudyGroup };
    } catch (error) {
      console.error('Error in createGroup:', error);
      return { data: null, error: 'Failed to create study group' };
    }
  }

  /**
   * Join a study group
   */
  static async joinGroup(groupId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      // Check if group exists and has space
      const { data: group, error: groupError } = await supabase
        .from('study_groups')
        .select('*, group_members(count)')
        .eq('id', groupId)
        .single();

      if (groupError || !group) {
        return { success: false, error: 'Study group not found' };
      }

      const currentMemberCount = group.group_members?.[0]?.count || 0;
      if (currentMemberCount >= group.max_members) {
        return { success: false, error: 'Study group is full' };
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .single();

      if (existingMember) {
        return { success: false, error: 'You are already a member of this group' };
      }

      // Add user to group
      const { error } = await supabase
        .from('group_members')
        .insert({
          group_id: groupId,
          user_id: user.id,
          role: 'member'
        });

      if (error) {
        console.error('Error joining group:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in joinGroup:', error);
      return { success: false, error: 'Failed to join study group' };
    }
  }

  /**
   * Leave a study group
   */
  static async leaveGroup(groupId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { success: false, error: 'User not authenticated' };
      }

      const { error } = await supabase
        .from('group_members')
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error leaving group:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in leaveGroup:', error);
      return { success: false, error: 'Failed to leave study group' };
    }
  }

  /**
   * Get members of a study group
   */
  static async getGroupMembers(groupId: string): Promise<GroupMembersResponse> {
    try {
      const { data, error, count } = await supabase
        .from('group_members')
        .select(`
          *,
          profiles(
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('group_id', groupId)
        .order('joined_at', { ascending: true });

      if (error) {
        console.error('Error fetching group members:', error);
        return { data: [], count: 0, error: error.message };
      }

      // Transform data to include profile information
      const transformedData: GroupMember[] = (data || []).map(member => ({
        ...member,
        profile: member.profiles
      }));

      return { data: transformedData, count: count || 0 };
    } catch (error) {
      console.error('Error in getGroupMembers:', error);
      return { data: [], count: 0, error: 'Failed to fetch group members' };
    }
  }

  /**
   * Get messages for a study group
   */
  static async getGroupMessages(groupId: string, limit: number = 50, offset: number = 0): Promise<GroupMessagesResponse> {
    try {
      const { data, error, count } = await supabase
        .from('group_messages')
        .select(`
          *,
          profiles(
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching group messages:', error);
        return { data: [], count: 0, error: error.message };
      }

      // Transform data to include sender profile information
      const transformedData: GroupMessage[] = (data || []).map(message => ({
        ...message,
        sender_profile: message.profiles
      }));

      return { data: transformedData, count: count || 0 };
    } catch (error) {
      console.error('Error in getGroupMessages:', error);
      return { data: [], count: 0, error: 'Failed to fetch group messages' };
    }
  }

  /**
   * Send a text message to a study group
   */
  static async sendMessage(groupId: string, messageText: string): Promise<{ data: GroupMessage | null; error?: string }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { data: null, error: 'User not authenticated' };
      }

      // Verify user is a member of the group
      const { data: membership } = await supabase
        .from('group_members')
        .select('id')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .single();

      if (!membership) {
        return { data: null, error: 'You are not a member of this group' };
      }

      const { data, error } = await supabase
        .from('group_messages')
        .insert({
          group_id: groupId,
          sender_id: user.id,
          message_text: messageText,
          message_type: 'text'
        })
        .select(`
          *,
          profiles(
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) {
        console.error('Error sending message:', error);
        return { data: null, error: error.message };
      }

      // Transform data
      const transformedData: GroupMessage = {
        ...data,
        sender_profile: data.profiles
      };

      return { data: transformedData };
    } catch (error) {
      console.error('Error in sendMessage:', error);
      return { data: null, error: 'Failed to send message' };
    }
  }

  /**
   * Check if current user is a member of a group
   */
  static async isGroupMember(groupId: string): Promise<{ isMember: boolean; role?: 'admin' | 'member' }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return { isMember: false };
      }

      const { data, error } = await supabase
        .from('group_members')
        .select('role')
        .eq('group_id', groupId)
        .eq('user_id', user.id)
        .single();

      if (error || !data) {
        return { isMember: false };
      }

      return { isMember: true, role: data.role };
    } catch (error) {
      console.error('Error checking group membership:', error);
      return { isMember: false };
    }
  }

  /**
   * Get a single study group by ID
   */
  static async getGroupById(groupId: string): Promise<{ data: StudyGroup | null; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('study_groups')
        .select('*')
        .eq('id', groupId)
        .single();

      if (error) {
        console.error('Error fetching group:', error);
        return { data: null, error: error.message };
      }

      // Get member count separately
      const { count: memberCount } = await supabase
        .from('group_members')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', data.id);

      // Transform data to include member count
      const transformedData: StudyGroup = {
        ...data,
        current_member_count: memberCount || 0
      };

      return { data: transformedData };
    } catch (error) {
      console.error('Error in getGroupById:', error);
      return { data: null, error: 'Failed to fetch study group' };
    }
  }
}
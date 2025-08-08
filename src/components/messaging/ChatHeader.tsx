import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { supabase } from '../../services/supabase/client';

interface ChatHeaderProps {
  groupId: string;
  onBackPress: () => void;
  onGroupInfoPress: () => void;
  onSearchPress: () => void;
}

interface GroupInfo {
  id: string;
  name: string;
  description?: string;
  member_count: number;
  members: Array<{
    id: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
  }>;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({
  groupId,
  onBackPress,
  onGroupInfoPress,
  onSearchPress,
}) => {
  const [groupInfo, setGroupInfo] = useState<GroupInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGroupInfo();
  }, [groupId]);

  const fetchGroupInfo = async () => {
    try {
      // Fetch group details
      const { data: groupData, error: groupError } = await supabase
        .from('study_groups')
        .select('id, name, description')
        .eq('id', groupId)
        .single();

      if (groupError) {
        console.error('Error fetching group:', groupError);
        return;
      }

      // Fetch group members
      const { data: membersData, error: membersError } = await supabase
        .from('group_members')
        .select(`
          id,
          profiles:user_id(
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .eq('group_id', groupId);

      if (membersError) {
        console.error('Error fetching members:', membersError);
        return;
      }

      const members = membersData?.map(member => ({
        id: member.profiles?.id || '',
        username: member.profiles?.username,
        full_name: member.profiles?.full_name,
        avatar_url: member.profiles?.avatar_url,
      })) || [];

      setGroupInfo({
        id: groupData.id,
        name: groupData.name,
        description: groupData.description,
        member_count: members.length,
        members,
      });
    } catch (error) {
      console.error('Error in fetchGroupInfo:', error);
    } finally {
      setLoading(false);
    }
  };

  const getSubtitle = () => {
    if (loading) return 'Loading...';
    if (!groupInfo) return 'Group not found';
    
    const count = groupInfo.member_count;
    return `${count} ${count === 1 ? 'member' : 'members'}`;
  };

  const renderGroupAvatar = () => {
    // Show first few member avatars or default group icon
    const displayMembers = groupInfo?.members.slice(0, 3) || [];
    
    if (displayMembers.length === 0 || !displayMembers.some(m => m.avatar_url)) {
      return (
        <View style={styles.defaultAvatar}>
          <Ionicons name="people" size={24} color={colors.white} />
        </View>
      );
    }

    if (displayMembers.length === 1 && displayMembers[0].avatar_url) {
      return (
        <Image
          source={{ uri: displayMembers[0].avatar_url }}
          style={styles.singleAvatar}
        />
      );
    }

    // Multiple avatars in a grid
    return (
      <View style={styles.multipleAvatars}>
        {displayMembers.slice(0, 4).map((member, index) => (
          <View
            key={member.id}
            style={[
              styles.miniAvatar,
              index === 0 && styles.topLeft,
              index === 1 && styles.topRight,
              index === 2 && styles.bottomLeft,
              index === 3 && styles.bottomRight,
            ]}
          >
            {member.avatar_url ? (
              <Image
                source={{ uri: member.avatar_url }}
                style={styles.miniAvatarImage}
              />
            ) : (
              <View style={styles.miniAvatarPlaceholder}>
                <Text style={styles.miniAvatarText}>
                  {(member.username || member.full_name || '?')[0].toUpperCase()}
                </Text>
              </View>
            )}
          </View>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={onBackPress}>
        <Ionicons name="arrow-back" size={24} color={colors.white} />
      </TouchableOpacity>

      <TouchableOpacity style={styles.groupInfo} onPress={onGroupInfoPress}>
        {renderGroupAvatar()}
        <View style={styles.textContainer}>
          <Text style={styles.groupName} numberOfLines={1}>
            {groupInfo?.name || 'Group Chat'}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {getSubtitle()}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton} onPress={onSearchPress}>
          <Ionicons name="search" size={22} color={colors.white} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={onGroupInfoPress}>
          <Ionicons name="ellipsis-vertical" size={22} color={colors.white} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backButton: {
    marginRight: 16,
    padding: 4,
  },
  groupInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    marginLeft: 12,
    flex: 1,
  },
  groupName: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.primaryText,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    opacity: 0.8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: 8,
    marginLeft: 8,
  },
  defaultAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  singleAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  multipleAvatars: {
    width: 40,
    height: 40,
    position: 'relative',
  },
  miniAvatar: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: colors.white,
  },
  topLeft: {
    top: 0,
    left: 0,
  },
  topRight: {
    top: 0,
    right: 0,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
  },
  miniAvatarImage: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  miniAvatarPlaceholder: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniAvatarText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.white,
  },
});
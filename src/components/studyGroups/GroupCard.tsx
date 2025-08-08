import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { StudyGroup } from '../../types/studyGroups';
import { colors } from '../../constants/colors';

interface GroupCardProps {
  group: StudyGroup;
  onPress: (group: StudyGroup) => void;
  onJoin?: (groupId: string) => void;
  showJoinButton?: boolean;
  isUserMember?: boolean;
  isMyGroupsView?: boolean;
}

export const GroupCard: React.FC<GroupCardProps> = ({
  group,
  onPress,
  onJoin,
  showJoinButton = false,
  isUserMember = false,
  isMyGroupsView = false
}) => {
  const handleJoin = () => {
    if (onJoin) {
      onJoin(group.id);
    }
  };

  const getMemberCountText = () => {
    const count = group.current_member_count || 0;
    const max = group.max_members;
    return `${count}/${max} members`;
  };

  const getGroupIcon = () => {
    // Different icons for different subjects
    const subjectIcons: { [key: string]: string } = {
      'Mathematics': '📐',
      'Science': '🔬',
      'English': '📚',
      'History': '🏛️',
      'Geography': '🌍',
      'Physics': '⚛️',
      'Chemistry': '🧪',
      'Biology': '🧬',
      'Computer Science': '💻',
      'Literature': '📖',
      'Economics': '📊',
      'Social Studies': '👥'
    };
    return subjectIcons[group.subject] || '👥';
  };

  const formatTime = () => {
    // Use actual group creation/update time
    const groupDate = new Date(group.updated_at || group.created_at);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - groupDate.getTime()) / (1000 * 60 * 60));
    const diffInDays = Math.floor(diffInHours / 24);
    
    if (diffInDays > 7) {
      // Show date if older than a week
      return groupDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } else if (diffInDays > 0) {
      // Show days ago
      return `${diffInDays}d`;
    } else if (diffInHours > 0) {
      // Show hours ago
      return `${diffInHours}h`;
    } else {
      // Show "now" for recent groups
      return 'now';
    }
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={() => onPress(group)}
      activeOpacity={0.8}
    >
      {/* Group Avatar */}
      <View style={styles.avatar}>
        <Text style={styles.avatarIcon}>{getGroupIcon()}</Text>
      </View>

      {/* Chat Content */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.groupName} numberOfLines={1}>
            {group.name}
          </Text>
          <View style={styles.rightSection}>
            <Text style={styles.time}>{formatTime()}</Text>
            {showJoinButton && !isUserMember && (
              <TouchableOpacity 
                style={[
                  styles.joinButton,
                  (group.current_member_count || 0) >= group.max_members && styles.joinButtonDisabled
                ]}
                onPress={handleJoin}
                disabled={(group.current_member_count || 0) >= group.max_members}
              >
                <Text style={[
                  styles.joinButtonText,
                  (group.current_member_count || 0) >= group.max_members && styles.joinButtonTextDisabled
                ]}>
                  {(group.current_member_count || 0) >= group.max_members ? 'Full' : 'Join'}
                </Text>
              </TouchableOpacity>
            )}
            {isUserMember && !isMyGroupsView && (
              <View style={styles.memberBadge}>
                <Text style={styles.memberBadgeText}>✓</Text>
              </View>
            )}
            {isMyGroupsView && (
              <TouchableOpacity 
                style={styles.leaveButton}
                onPress={handleJoin}
              >
                <Text style={styles.leaveButtonText}>Leave</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.bottomRow}>
          <Text style={styles.lastMessage} numberOfLines={1}>
            {group.description || `${group.subject} • ${getMemberCountText()}`}
          </Text>
          {group.privacy_level === 'private' && (
            <Text style={styles.privateIcon}>🔒</Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.disabled,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarIcon: {
    fontSize: 24,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  rightSection: {
    alignItems: 'flex-end',
  },
  time: {
    fontSize: 12,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lastMessage: {
    fontSize: 14,
    color: colors.textSecondary,
    flex: 1,
    marginRight: 8,
  },
  privateIcon: {
    fontSize: 12,
  },
  joinButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 50,
    alignItems: 'center',
  },
  joinButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  joinButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  joinButtonTextDisabled: {
    color: colors.textSecondary,
  },
  memberBadge: {
    backgroundColor: colors.success,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberBadgeText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  leaveButton: {
    backgroundColor: colors.error,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    minWidth: 50,
    alignItems: 'center',
  },
  leaveButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
});
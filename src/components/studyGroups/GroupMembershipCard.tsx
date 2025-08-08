import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { StudyGroup } from '../../types/studyGroups';
import { colors } from '../../constants/colors';

interface GroupMembershipCardProps {
  group: StudyGroup;
  onLeave: (groupId: string) => Promise<{ success: boolean; error?: string }>;
  onPress?: (group: StudyGroup) => void;
}

export const GroupMembershipCard: React.FC<GroupMembershipCardProps> = ({
  group,
  onLeave,
  onPress
}) => {
  const [leaving, setLeaving] = useState(false);

  const handleLeave = () => {
    Alert.alert(
      'Leave Group',
      `Are you sure you want to leave "${group.name}"? You'll need to request to join again if it's a private group.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            setLeaving(true);
            try {
              const result = await onLeave(group.id);
              if (!result.success) {
                Alert.alert('Error', result.error || 'Failed to leave group');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to leave group');
            } finally {
              setLeaving(false);
            }
          }
        }
      ]
    );
  };

  const getMemberCountText = () => {
    const count = group.current_member_count || 0;
    const max = group.max_members;
    return `${count}/${max} members`;
  };

  const getPrivacyIcon = () => {
    return group.privacy_level === 'private' ? '🔒' : '🌐';
  };

  return (
    <TouchableOpacity 
      style={styles.container} 
      onPress={() => onPress?.(group)}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.groupName} numberOfLines={1}>
            {group.name}
          </Text>
          <Text style={styles.privacyIcon}>{getPrivacyIcon()}</Text>
        </View>
        <Text style={styles.subject}>{group.subject}</Text>
      </View>

      {group.description && (
        <Text style={styles.description} numberOfLines={2}>
          {group.description}
        </Text>
      )}

      <View style={styles.footer}>
        <View style={styles.memberInfo}>
          <Text style={styles.memberCount}>{getMemberCountText()}</Text>
          {group.recent_activity && (
            <Text style={styles.recentActivity}>
              Recent activity: {group.recent_activity}
            </Text>
          )}
        </View>

        <View style={styles.actions}>
          <View style={styles.memberBadge}>
            <Text style={styles.memberBadgeText}>Member</Text>
          </View>
          
          <TouchableOpacity 
            style={[styles.leaveButton, leaving && styles.leaveButtonDisabled]}
            onPress={handleLeave}
            disabled={leaving}
          >
            <Text style={[styles.leaveButtonText, leaving && styles.leaveButtonTextDisabled]}>
              {leaving ? 'Leaving...' : 'Leave'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    marginVertical: 6,
    marginHorizontal: 16,
    shadowColor: colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
  },
  header: {
    marginBottom: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  groupName: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    marginRight: 8,
  },
  privacyIcon: {
    fontSize: 16,
  },
  subject: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  memberInfo: {
    flex: 1,
  },
  memberCount: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  recentActivity: {
    fontSize: 11,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  memberBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  memberBadgeText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  leaveButton: {
    backgroundColor: colors.error,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  leaveButtonDisabled: {
    backgroundColor: colors.disabled,
  },
  leaveButtonText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: '600',
  },
  leaveButtonTextDisabled: {
    color: colors.textSecondary,
  },
});
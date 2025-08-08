import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants/colors';
import { GroupMessage } from '../../types/studyGroups';
import { ResourcePreview } from './ResourcePreview';

interface MessageCardProps {
  message: GroupMessage;
  isCurrentUser: boolean;
  showSenderName?: boolean;
  onFilePress?: (fileUrl: string, fileName?: string) => void;
  onImagePress?: (imageUrl: string) => void;
}

export const MessageCard: React.FC<MessageCardProps> = ({
  message,
  isCurrentUser,
  showSenderName = true,
  onFilePress,
  onImagePress,
}) => {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const renderResourceContent = () => {
    if (message.message_type !== 'text' && message.file_url) {
      return (
        <ResourcePreview
          message={message}
          isCurrentUser={isCurrentUser}
          onImagePress={onImagePress}
        />
      );
    }
    return null;
  };

  return (
    <View style={[
      styles.messageContainer,
      isCurrentUser ? styles.currentUserMessage : styles.otherUserMessage
    ]}>
      {/* Sender name for group chats */}
      {!isCurrentUser && showSenderName && (
        <Text style={styles.senderName}>
          {(() => {
            // Debug logging
            console.log('MessageCard debug:', {
              messageId: message.id,
              senderId: message.sender_id,
              profiles: message.profiles,
              hasProfiles: !!message.profiles,
              username: message.profiles?.username,
              fullName: message.profiles?.full_name
            });
            
            return message.profiles?.username || message.profiles?.full_name || 'Unknown User';
          })()}
        </Text>
      )}

      {/* Resource content (images and files) */}
      {renderResourceContent()}

      {/* Text content (only for text messages or non-image messages with text) */}
      {message.message_text && message.message_type === 'text' && (
        <Text style={[
          styles.messageText,
          isCurrentUser ? styles.currentUserText : styles.otherUserText
        ]}>
          {message.message_text}
        </Text>
      )}

      {/* Message metadata */}
      <View style={styles.messageFooter}>
        <Text style={[
          styles.timestamp,
          isCurrentUser ? styles.currentUserTimestamp : styles.otherUserTimestamp
        ]}>
          {formatTime(message.created_at)}
        </Text>
        
        {/* Delivery status for current user messages */}
        {isCurrentUser && (
          <Ionicons
            name="checkmark-done"
            size={16}
            color={colors.success}
            style={styles.deliveryStatus}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  messageContainer: {
    maxWidth: '80%',
    marginVertical: 2,
    marginHorizontal: 12,
    padding: 8,
    borderRadius: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  currentUserMessage: {
    backgroundColor: colors.surface,
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  otherUserMessage: {
    backgroundColor: colors.surface,
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
    marginBottom: 4,
  },
  currentUserText: {
    color: colors.white,
  },
  otherUserText: {
    color: colors.text,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 2,
  },
  timestamp: {
    fontSize: 11,
    marginRight: 4,
  },
  currentUserTimestamp: {
    color: colors.white,
    opacity: 0.8,
  },
  otherUserTimestamp: {
    color: colors.textSecondary,
  },
  deliveryStatus: {
    marginLeft: 2,
  },
});
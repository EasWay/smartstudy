import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, FlatList, Platform, Alert, RefreshControl, StatusBar, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareView } from '../../components/common/KeyboardAwareView';
import { useRoute, RouteProp, useNavigation } from '@react-navigation/native';
import { supabase } from '../../services/supabase/client';
import { useAuth } from '../../context/AuthContext';
import { StudyGroupsStackParamList } from '../../types/navigation';
import { GroupMessage } from '../../types/studyGroups';
import { colors } from '../../constants/colors';
import { MessageCard } from '../../components/messaging/MessageCard';
import { MessageInput } from '../../components/messaging/MessageInput';
import { TypingIndicator } from '../../components/messaging/TypingIndicator';
import { ChatHeader } from '../../components/messaging/ChatHeader';
import { MessagingService } from '../../services/messaging/messagingService';
import { useToast } from '../../context/ToastContext';
import { ImageViewer } from '../../components/messaging/ImageViewer';

type GroupChatScreenRouteProp = RouteProp<StudyGroupsStackParamList, 'GroupChat'>;

export default function GroupChatScreen() {
  const { user } = useAuth();
  const route = useRoute<GroupChatScreenRouteProp>();
  const navigation = useNavigation();

  const { showToast } = useToast();
  const { groupId } = route.params;

  const [messages, setMessages] = useState<GroupMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isTyping] = useState(false);
  const [typingUsers] = useState<string[]>([]);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState('');
  const [selectedImageName, setSelectedImageName] = useState('');

  const flatListRef = useRef<FlatList>(null);
  const subscriptionRef = useRef<any>(null);

  // Fetch initial messages
  const fetchMessages = useCallback(async (refresh = false) => {
    try {
      if (refresh) setRefreshing(true);
      else setLoading(true);

      const { data, error } = await MessagingService.getGroupMessages(groupId, 50, 0);

      if (error) {
        showToast(error, 'error');
        return;
      }

      // Ensure unique messages
      const uniqueMessages = data.filter((message, index, self) =>
        index === self.findIndex(m => m.id === message.id)
      );

      setMessages(uniqueMessages);
      setHasMoreMessages(data.length === 50);

      // Scroll to bottom after loading messages
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);

    } catch (error) {
      console.error('Error fetching messages:', error);
      showToast('Failed to load messages', 'error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [groupId, showToast]);

  // Load more messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (loadingMore || !hasMoreMessages) return;

    try {
      setLoadingMore(true);
      const { data, error } = await MessagingService.getGroupMessages(
        groupId,
        20,
        messages.length
      );

      if (error) {
        showToast(error, 'error');
        return;
      }

      if (data.length === 0) {
        setHasMoreMessages(false);
        return;
      }

      setMessages(prev => {
        const combined = [...data, ...prev];
        // Remove duplicates
        const uniqueMessages = combined.filter((message, index, self) =>
          index === self.findIndex(m => m.id === message.id)
        );
        return uniqueMessages;
      });
      setHasMoreMessages(data.length === 20);
    } catch (error) {
      console.error('Error loading more messages:', error);
      showToast('Failed to load more messages', 'error');
    } finally {
      setLoadingMore(false);
    }
  }, [groupId, messages.length, hasMoreMessages, loadingMore, showToast]);

  // Set up keyboard listeners for auto-scroll
  useEffect(() => {
    const keyboardShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (event) => {
        // Auto-scroll to bottom when keyboard shows
        const delay = Platform.OS === 'ios' ? event.duration || 100 : 200;
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, delay);
      }
    );

    const keyboardHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        // Optional: Maintain scroll position when keyboard hides
        // You can add logic here if needed
      }
    );

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, []);

  // Set up real-time subscription
  useEffect(() => {
    fetchMessages();

    // Set up real-time subscription
    subscriptionRef.current = supabase
      .channel(`group_messages:${groupId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'group_messages',
          filter: `group_id=eq.${groupId}`,
        },
        async (payload) => {
          // Fetch the complete message with profile data
          const { data: newMessageData } = await supabase
            .from('group_messages')
            .select(`
              *,
              profiles:sender_id(
                id,
                username,
                full_name,
                avatar_url
              )
            `)
            .eq('id', payload.new.id)
            .single();

          if (newMessageData) {
            setMessages(prev => {
              // More robust duplicate check
              const messageExists = prev.find(msg => msg.id === newMessageData.id);
              if (messageExists) {
                console.log('Duplicate message prevented:', newMessageData.id);
                return prev;
              }

              // Add new message and ensure unique IDs
              const newMessages = [...prev, newMessageData as GroupMessage];

              // Remove any potential duplicates (extra safety)
              const uniqueMessages = newMessages.filter((message, index, self) =>
                index === self.findIndex(m => m.id === message.id)
              );

              return uniqueMessages;
            });

            // Auto-scroll to bottom if user is near the bottom
            setTimeout(() => {
              flatListRef.current?.scrollToEnd({ animated: true });
            }, 100);
          }
        }
      )
      .subscribe();

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [groupId, fetchMessages]);

  // Handle sending text messages
  const handleSendMessage = useCallback(async (messageText: string) => {
    if (!user?.id) {
      showToast('You must be logged in to send messages', 'error');
      return;
    }

    try {
      const { error } = await MessagingService.sendTextMessage({
        groupId,
        senderId: user.id,
        messageText,
        messageType: 'text',
      });

      if (error) {
        showToast(error, 'error');
      } else {
        // Scroll to bottom after sending message
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      showToast('Failed to send message', 'error');
    }
  }, [user?.id, groupId, showToast]);

  // Handle sending file messages
  const handleSendFile = useCallback(async (
    file: { uri: string; name: string; type: string; size: number },
    messageText?: string
  ) => {
    if (!user?.id) {
      showToast('You must be logged in to send files', 'error');
      return;
    }

    try {
      const { error } = await MessagingService.sendFileMessage({
        groupId,
        senderId: user.id,
        messageText,
        file,
      });

      if (error) {
        showToast(error, 'error');
      } else {
        showToast('File sent successfully', 'success');
        // Scroll to bottom after sending file
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    } catch (error) {
      console.error('Error sending file:', error);
      showToast('Failed to send file', 'error');
    }
  }, [user?.id, groupId, showToast]);

  // Handle file press (download/view)
  const handleFilePress = useCallback((_fileUrl: string, fileName?: string) => {
    Alert.alert(
      'File Options',
      fileName || 'File',
      [
        { text: 'View', onPress: () => {/* TODO: Implement file viewer */ } },
        { text: 'Download', onPress: () => {/* TODO: Implement download */ } },
        { text: 'Cancel', style: 'cancel' },
      ]
    );
  }, []);

  // Handle image press (full screen view)
  const handleImagePress = useCallback((imageUrl: string) => {
    // Find the message to get the file name
    const message = messages.find(msg => msg.file_url === imageUrl);
    setSelectedImageUrl(imageUrl);
    setSelectedImageName(message?.file_name || 'Image');
    setImageViewerVisible(true);
  }, [messages]);

  // Render message item
  const renderMessage = useCallback(({ item, index }: { item: GroupMessage; index: number }) => {
    const isCurrentUser = item.sender_id === user?.id;
    const previousMessage = index > 0 ? messages[index - 1] : null;
    const showSenderName = !isCurrentUser &&
      (!previousMessage || previousMessage.sender_id !== item.sender_id);

    return (
      <MessageCard
        message={item}
        isCurrentUser={isCurrentUser}
        showSenderName={showSenderName}
        onFilePress={handleFilePress}
        onImagePress={handleImagePress}
      />
    );
  }, [user?.id, messages, handleFilePress, handleImagePress]);

  // Get item layout for better performance
  const getItemLayout = useCallback((_data: any, index: number) => ({
    length: 80, // Approximate message height
    offset: 80 * index,
    index,
  }), []);

  // Header handlers
  const handleBackPress = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleGroupInfoPress = useCallback(() => {
    // TODO: Navigate to group info screen
    console.log('Group info pressed');
  }, []);

  const handleSearchPress = useCallback(() => {
    // TODO: Implement message search
    console.log('Search pressed');
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar backgroundColor={colors.primary} barStyle="light-content" />

      <ChatHeader
        groupId={groupId}
        onBackPress={handleBackPress}
        onGroupInfoPress={handleGroupInfoPress}
        onSearchPress={handleSearchPress}
      />

      <KeyboardAwareView 
        style={styles.chatContainer}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => `${item.id}-${index}`}
          renderItem={renderMessage}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMoreMessages}
          onEndReachedThreshold={0.1}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchMessages(true)}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          getItemLayout={getItemLayout}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={20}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 10,
          }}
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          automaticallyAdjustContentInsets={false}
          contentInsetAdjustmentBehavior={Platform.OS === 'ios' ? 'automatic' : undefined}
        />

        <TypingIndicator
          isVisible={isTyping}
          usernames={typingUsers}
        />

        <View style={styles.inputContainer}>
          <MessageInput
            onSendMessage={handleSendMessage}
            onSendFile={handleSendFile}
            placeholder="Type a message..."
            disabled={loading}
          />
        </View>
      </KeyboardAwareView>

      {/* Image Viewer Modal */}
      <ImageViewer
        visible={imageViewerVisible}
        imageUrl={selectedImageUrl}
        fileName={selectedImageName}
        onClose={() => setImageViewerVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContainer: {
    paddingVertical: 8,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    flexGrow: 1,
  },
  inputContainer: {
    backgroundColor: colors.background,
    paddingBottom: Platform.OS === 'ios' ? 20 : 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
});
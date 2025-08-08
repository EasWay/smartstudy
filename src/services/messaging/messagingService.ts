import { supabase } from '../supabase/client';
import { StorageService } from '../storage/StorageService';
import { uploadFileWithSessionReactNative } from '../storage/uploadFileWithSessionReactNative';
import { sanitizeFilename } from '../storage/pathUtils';
import { GroupMessage } from '../../types/studyGroups';

export interface SendMessageParams {
  groupId: string;
  senderId: string;
  messageText?: string;
  messageType?: 'text' | 'file' | 'image' | 'video' | 'document';
}

export interface SendFileMessageParams extends SendMessageParams {
  file: {
    uri: string;
    name: string;
    type: string;
    size: number;
  };
}

export class MessagingService {
  /**
   * Send a text message to a group
   */
  static async sendTextMessage(params: SendMessageParams): Promise<{ data: GroupMessage | null; error?: string }> {
    try {
      const { data, error } = await supabase
        .from('group_messages')
        .insert({
          group_id: params.groupId,
          sender_id: params.senderId,
          message_text: params.messageText,
          message_type: 'text',
        })
        .select(`
          *,
          profiles:sender_id(
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) {
        console.error('Error sending text message:', error);
        return { data: null, error: error.message };
      }

      return { data: data as GroupMessage };
    } catch (error) {
      console.error('Error in sendTextMessage:', error);
      return { data: null, error: 'Failed to send message' };
    }
  }

  /**
   * Send a file message to a group
   */
  static async sendFileMessage(params: SendFileMessageParams): Promise<{ data: GroupMessage | null; error?: string }> {
    try {
      // First, upload the file to storage using React Native optimized function
      const bucket = 'gfiles';
      const fileName = sanitizeFilename(params.file.name);
      const filePath = `${params.groupId}/${params.senderId}/${Date.now()}_${fileName}`;

      // Create file object for React Native upload
      const fileForUpload = {
        uri: params.file.uri,
        name: fileName,
        type: params.file.type,
        size: params.file.size,
      };

      const uploadResult = await uploadFileWithSessionReactNative(
        fileForUpload,
        filePath,
        bucket
      );

      if (!uploadResult || !uploadResult.path) {
        return { data: null, error: 'Failed to upload file' };
      }

      // Determine message type based on file type
      let messageType: 'file' | 'image' | 'video' | 'document' = 'file';
      if (params.file.type.startsWith('image/')) {
        messageType = 'image';
      } else if (params.file.type.startsWith('video/')) {
        messageType = 'video';
      } else if (
        params.file.type.includes('pdf') ||
        params.file.type.includes('doc') ||
        params.file.type.includes('sheet') ||
        params.file.type.includes('presentation')
      ) {
        messageType = 'document';
      }

      // Create the message record
      const { data, error } = await supabase
        .from('group_messages')
        .insert({
          group_id: params.groupId,
          sender_id: params.senderId,
          message_text: params.messageText,
          message_type: messageType,
          file_url: uploadResult.publicUrl || uploadResult.path,
          file_path: uploadResult.path,
          file_name: params.file.name,
          file_size: params.file.size,
          file_type: params.file.type,
        })
        .select(`
          *,
          profiles:sender_id(
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) {
        console.error('Error creating file message:', error);
        // Clean up uploaded file if message creation failed
        await StorageService.deleteFile(bucket, uploadResult.path);
        return { data: null, error: error.message };
      }

      // Track file upload in file_uploads table
      await supabase.from('file_uploads').insert({
        user_id: params.senderId,
        file_path: uploadResult.path,
        file_name: params.file.name,
        file_size: params.file.size,
        file_type: params.file.type,
        bucket_name: bucket,
        upload_status: 'completed',
        message_id: data.id,
        completed_at: new Date().toISOString(),
      });

      return { data: data as GroupMessage };
    } catch (error) {
      console.error('Error in sendFileMessage:', error);
      return { data: null, error: 'Failed to send file message' };
    }
  }

  /**
   * Get messages for a group with pagination
   */
  static async getGroupMessages(
    groupId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<{ data: GroupMessage[]; count: number; error?: string }> {
    try {
      const { data, error, count } = await supabase
        .from('group_messages')
        .select(`
          *,
          profiles:sender_id(
            id,
            username,
            full_name,
            avatar_url
          )
        `, { count: 'exact' })
        .eq('group_id', groupId)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      if (error) {
        console.error('Error fetching group messages:', error);
        return { data: [], count: 0, error: error.message };
      }

      // Reverse to show oldest first
      const messages = (data || []).reverse() as GroupMessage[];

      return { data: messages, count: count || 0 };
    } catch (error) {
      console.error('Error in getGroupMessages:', error);
      return { data: [], count: 0, error: 'Failed to fetch messages' };
    }
  }

  /**
   * Mark messages as read
   */
  static async markMessagesAsRead(messageIds: string[], userId: string): Promise<{ error?: string }> {
    try {
      // This would typically update a read_receipts table
      // For now, we'll just log the action
      console.log('Marking messages as read:', messageIds, 'for user:', userId);
      return {};
    } catch (error) {
      console.error('Error marking messages as read:', error);
      return { error: 'Failed to mark messages as read' };
    }
  }

  /**
   * Delete a message (only by sender or group admin)
   */
  static async deleteMessage(messageId: string, userId: string): Promise<{ error?: string }> {
    try {
      // First check if user can delete this message
      const { data: message, error: fetchError } = await supabase
        .from('group_messages')
        .select('sender_id, file_path')
        .eq('id', messageId)
        .single();

      if (fetchError) {
        return { error: 'Message not found' };
      }

      // Check if user is the sender or group admin
      const canDelete = message.sender_id === userId;
      // TODO: Add group admin check

      if (!canDelete) {
        return { error: 'You can only delete your own messages' };
      }

      // Delete the message
      const { error: deleteError } = await supabase
        .from('group_messages')
        .delete()
        .eq('id', messageId);

      if (deleteError) {
        return { error: deleteError.message };
      }

      // Clean up file if it exists
      if (message.file_path) {
        await StorageService.deleteFile('gfiles', message.file_path);
      }

      return {};
    } catch (error) {
      console.error('Error deleting message:', error);
      return { error: 'Failed to delete message' };
    }
  }
}
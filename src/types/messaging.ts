export interface Message {
  id: string;
  group_id: string;
  sender_id: string;
  message_text?: string;
  message_type: 'text' | 'file' | 'image' | 'video' | 'document';
  file_url?: string;
  file_path?: string;
  file_name?: string;
  file_size?: number;
  file_type?: string;
  thumbnail_url?: string;
  created_at: string;
  profiles?: {
    username?: string;
  };
}
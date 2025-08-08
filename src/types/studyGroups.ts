// Study Groups type definitions

export interface StudyGroup {
  id: string;
  name: string;
  description?: string;
  subject: string;
  privacy_level: 'public' | 'private';
  max_members: number;
  created_by: string;
  created_at: string;
  updated_at: string;
  // Computed fields
  current_member_count?: number;
  members?: GroupMember[];
  recent_activity?: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  // Joined profile data
  profile?: {
    id: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export interface GroupMessage {
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
  // Joined profile data (from Supabase join)
  profiles?: {
    id: string;
    username?: string;
    full_name?: string;
    avatar_url?: string;
  };
}

export interface CreateGroupData {
  name: string;
  description?: string;
  subject: string;
  privacy_level: 'public' | 'private';
  max_members?: number;
}

export interface GroupSearchFilters {
  subject?: string;
  privacy_level?: 'public' | 'private';
  search_query?: string;
}

export interface GroupJoinRequest {
  group_id: string;
  user_id: string;
}

export interface GroupFileUpload {
  group_id: string;
  file: File | Blob;
  file_name: string;
  file_type: string;
  message_text?: string;
}

// API Response types
export interface StudyGroupsResponse {
  data: StudyGroup[];
  count: number;
  error?: string;
}

export interface GroupMembersResponse {
  data: GroupMember[];
  count: number;
  error?: string;
}

export interface GroupMessagesResponse {
  data: GroupMessage[];
  count: number;
  error?: string;
}
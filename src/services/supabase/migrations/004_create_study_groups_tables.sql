-- Migration: Create study groups tables
-- This migration creates the study groups, group members, and group messages tables

-- Create study_groups table
CREATE TABLE IF NOT EXISTS public.study_groups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  privacy_level TEXT CHECK (privacy_level IN ('public', 'private')) DEFAULT 'public',
  max_members INTEGER DEFAULT 20,
  created_by UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create group_members table
CREATE TABLE IF NOT EXISTS public.group_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('admin', 'member')) DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(group_id, user_id)
);

-- Create group_messages table with file storage support
CREATE TABLE IF NOT EXISTS public.group_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  message_text TEXT,
  message_type TEXT CHECK (message_type IN ('text', 'file', 'image', 'video', 'document')) DEFAULT 'text',
  file_url TEXT,
  file_path TEXT, -- Storage path for Supabase Storage
  file_name TEXT, -- Original filename
  file_size BIGINT, -- File size in bytes
  file_type TEXT, -- MIME type
  thumbnail_url TEXT, -- Generated thumbnail for media files
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_study_groups_created_by ON study_groups(created_by);
CREATE INDEX IF NOT EXISTS idx_study_groups_subject ON study_groups(subject);
CREATE INDEX IF NOT EXISTS idx_study_groups_privacy_level ON study_groups(privacy_level);
CREATE INDEX IF NOT EXISTS idx_study_groups_created_at ON study_groups(created_at);

CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_role ON group_members(role);

CREATE INDEX IF NOT EXISTS idx_group_messages_group_id ON group_messages(group_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_sender_id ON group_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_group_messages_created_at ON group_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_group_messages_message_type ON group_messages(message_type);

-- Enable Row Level Security
ALTER TABLE public.study_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for study_groups table
-- Anyone can view public groups
CREATE POLICY "Anyone can view public study groups" ON public.study_groups
  FOR SELECT USING (privacy_level = 'public');

-- Group members can view private groups
CREATE POLICY "Group members can view private study groups" ON public.study_groups
  FOR SELECT USING (
    privacy_level = 'private' AND 
    EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = study_groups.id AND user_id = auth.uid()
    )
  );

-- Authenticated users can create groups
CREATE POLICY "Authenticated users can create study groups" ON public.study_groups
  FOR INSERT WITH CHECK (auth.uid() = created_by);

-- Group creators can update their groups
CREATE POLICY "Group creators can update their study groups" ON public.study_groups
  FOR UPDATE USING (auth.uid() = created_by);

-- Group creators can delete their groups
CREATE POLICY "Group creators can delete their study groups" ON public.study_groups
  FOR DELETE USING (auth.uid() = created_by);

-- Create RLS policies for group_members table
-- Group members can view other members in their groups
CREATE POLICY "Group members can view group membership" ON group_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members gm 
      WHERE gm.group_id = group_members.group_id AND gm.user_id = auth.uid()
    )
  );

-- Users can join groups (will be controlled by application logic)
CREATE POLICY "Users can join groups" ON group_members
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Group admins and the user themselves can remove membership
CREATE POLICY "Users can leave groups or admins can remove members" ON group_members
  FOR DELETE USING (
    auth.uid() = user_id OR 
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = group_members.group_id AND user_id = auth.uid() AND role = 'admin'
    )
  );

-- Create RLS policies for group_messages table
-- Group members can view messages in their groups
CREATE POLICY "Group members can view group messages" ON group_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = group_messages.group_id AND user_id = auth.uid()
    )
  );

-- Group members can send messages
CREATE POLICY "Group members can send messages" ON group_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = group_messages.group_id AND user_id = auth.uid()
    )
  );

-- Message senders can update their own messages
CREATE POLICY "Users can update their own messages" ON group_messages
  FOR UPDATE USING (auth.uid() = sender_id);

-- Message senders and group admins can delete messages
CREATE POLICY "Users can delete their own messages or admins can delete any" ON group_messages
  FOR DELETE USING (
    auth.uid() = sender_id OR
    EXISTS (
      SELECT 1 FROM group_members 
      WHERE group_id = group_messages.group_id AND user_id = auth.uid() AND role = 'admin'
    )
  );

-- Add comments for documentation
COMMENT ON TABLE study_groups IS 'Study groups created by users for collaboration';
COMMENT ON TABLE group_members IS 'Membership tracking for study groups';
COMMENT ON TABLE group_messages IS 'Messages and file sharing within study groups';

COMMENT ON COLUMN study_groups.privacy_level IS 'Group visibility: public or private';
COMMENT ON COLUMN study_groups.max_members IS 'Maximum number of members allowed in the group';
COMMENT ON COLUMN group_members.role IS 'Member role: admin or member';
COMMENT ON COLUMN group_messages.message_type IS 'Type of message: text, file, image, video, document';
COMMENT ON COLUMN group_messages.file_path IS 'Path to file in Supabase Storage for file messages';

-- Create function to update updated_at timestamp for study_groups
CREATE TRIGGER update_study_groups_updated_at 
    BEFORE UPDATE ON study_groups 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to automatically add creator as admin when group is created
CREATE OR REPLACE FUNCTION add_group_creator_as_admin()
RETURNS TRIGGER AS $
BEGIN
  INSERT INTO group_members (group_id, user_id, role)
  VALUES (NEW.id, NEW.created_by, 'admin');
  RETURN NEW;
END;
$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically add creator as admin
CREATE TRIGGER on_study_group_created
  AFTER INSERT ON study_groups
  FOR EACH ROW EXECUTE FUNCTION add_group_creator_as_admin();

-- Update file_uploads table to support group messages
ALTER TABLE file_uploads 
ADD COLUMN IF NOT EXISTS message_id UUID REFERENCES group_messages(id) ON DELETE CASCADE;

-- Add comment for the new column
COMMENT ON COLUMN file_uploads.message_id IS 'Reference to group message if file is attached to a message';
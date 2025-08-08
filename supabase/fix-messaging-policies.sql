-- Fix messaging policies for existing group_messages table
-- This assumes your group_messages table already exists from 004_create_study_groups_tables.sql

-- Ensure RLS is enabled (should already be enabled from migration)
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Allow members to view messages" ON public.group_messages;
DROP POLICY IF EXISTS "Allow members to insert messages" ON public.group_messages;
DROP POLICY IF EXISTS "Group members can view group messages" ON public.group_messages;
DROP POLICY IF EXISTS "Group members can send messages" ON public.group_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.group_messages;
DROP POLICY IF EXISTS "Users can delete their own messages or admins can delete any" ON public.group_messages;

-- Create the correct RLS policies for group_messages
CREATE POLICY "Group members can view group messages" ON public.group_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = group_messages.group_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Group members can send messages" ON public.group_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = group_messages.group_id AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own messages" ON public.group_messages
  FOR UPDATE USING (auth.uid() = sender_id);

CREATE POLICY "Users can delete their own messages or admins can delete any" ON public.group_messages
  FOR DELETE USING (
    auth.uid() = sender_id OR
    EXISTS (
      SELECT 1 FROM public.group_members 
      WHERE group_id = group_messages.group_id AND user_id = auth.uid() AND role = 'admin'
    )
  );

-- Configure real-time subscriptions
-- Use DO block to safely handle publication changes
DO $$
BEGIN
  -- Try to remove the table from publication (ignore if it doesn't exist)
  BEGIN
    ALTER PUBLICATION supabase_realtime DROP TABLE public.group_messages;
  EXCEPTION
    WHEN undefined_table THEN
      -- Table wasn't in publication, that's fine
      NULL;
    WHEN others THEN
      -- Other errors, that's also fine for this operation
      NULL;
  END;
  
  -- Add the table to publication
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;
  EXCEPTION
    WHEN duplicate_object THEN
      -- Table already in publication, that's fine
      NULL;
  END;
END $$;

-- Ensure file_uploads table has message_id column (should already exist from newsql.sql)
-- This is safe to run multiple times
ALTER TABLE public.file_uploads 
ADD COLUMN IF NOT EXISTS message_id UUID REFERENCES public.group_messages(id) ON DELETE CASCADE;

-- Add index for message_id lookups if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_file_uploads_message_id ON public.file_uploads (message_id);
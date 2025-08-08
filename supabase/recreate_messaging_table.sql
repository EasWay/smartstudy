-- Force recreation of group_messages table with correct schema

-- Drop existing table and any dependent objects (like policies)
DROP TABLE IF EXISTS public.group_messages CASCADE;

-- Create group_messages table
CREATE TABLE public.group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- This is the crucial column
  content TEXT,
  file_url TEXT,
  file_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies for group_messages
ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow members to view messages" ON public.group_messages
  FOR SELECT
  USING (group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()));

CREATE POLICY "Allow members to insert messages" ON public.group_messages
  FOR INSERT
  WITH CHECK (sender_id = auth.uid() AND group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()));

-- Configure real-time subscriptions
ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;
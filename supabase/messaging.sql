-- Stage 9: Real-time Messaging with File Sharing

-- 9.1: Create enhanced messaging database schema

-- Create group_messages table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE, -- Corrected FK to profiles table
  content TEXT,
  file_url TEXT,
  file_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS policies for group_messages
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Allow members to view messages') THEN
    ALTER TABLE public.group_messages ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Allow members to view messages" ON public.group_messages
      FOR SELECT
      USING (group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polname = 'Allow members to insert messages') THEN
    CREATE POLICY "Allow members to insert messages" ON public.group_messages
      FOR INSERT
      WITH CHECK (sender_id = auth.uid() AND group_id IN (SELECT group_id FROM public.group_members WHERE user_id = auth.uid()));
  END IF;
END
$$;

-- Configure real-time subscriptions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'group_messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.group_messages;
  END IF;
END
$$;
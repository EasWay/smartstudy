-- Enable Row Level Security on the resources table
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;

-- 1. Policy for SELECT access to resources
-- Allows users to select public resources, or their own private resources.
CREATE POLICY "Users can view public and their own resources"
ON public.resources FOR SELECT
USING (
  is_public = TRUE OR uploaded_by = auth.uid()
);

-- 2. Policy for INSERT access to resources
-- Allows authenticated users to insert resources, setting themselves as the uploader.
CREATE POLICY "Users can insert their own resources"
ON public.resources FOR INSERT
WITH CHECK (
  uploaded_by = auth.uidA()
);

-- 3. Policy for UPDATE access to resources
-- Allows users to update their own resources.
CREATE POLICY "Users can update their own resources"
ON public.resources FOR UPDATE
USING (
  uploaded_by = auth.uid()
)
WITH CHECK (
  uploaded_by = auth.uid()
);

-- 4. Policy for DELETE access to resources
-- Allows users to delete their own resources.
CREATE POLICY "Users can delete their own resources"
ON public.resources FOR DELETE
USING (
  uploaded_by = auth.uid()
);

-- Create the file_uploads table
CREATE TABLE public.file_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  file_type TEXT NOT NULL,
  bucket_name TEXT NOT NULL,
  upload_status TEXT CHECK (upload_status IN ('pending', 'completed', 'failed')) DEFAULT 'pending',
  resource_id UUID REFERENCES public.resources(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.group_messages(id) ON DELETE CASCADE, -- Assuming group_messages table exists or will be created
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Optional: Add an index for faster lookups by user_id
CREATE INDEX idx_file_uploads_user_id ON public.file_uploads (user_id);

-- Optional: Add an index for faster lookups by resource_id
CREATE INDEX idx_file_uploads_resource_id ON public.file_uploads (resource_id);

-- Optional: Add an index for faster lookups by message_id
CREATE INDEX idx_file_uploads_message_id ON public.file_uploads (message_id);

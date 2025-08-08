-- Create the resources table
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  resource_type TEXT CHECK (resource_type IN ('document', 'link', 'video', 'book', 'image')),
  file_url TEXT,
  file_path TEXT, -- Storage path for Supabase Storage
  file_size BIGINT, -- File size in bytes
  file_type TEXT, -- MIME type
  thumbnail_url TEXT, -- Generated thumbnail for images/videos
  external_url TEXT,
  subject TEXT,
  grade_level TEXT,
  uploaded_by UUID REFERENCES public.profiles(id),
  is_public BOOLEAN DEFAULT true,
  download_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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
  uploaded_by = auth.uid()
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

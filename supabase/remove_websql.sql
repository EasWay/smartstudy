-- Drop the trigger first
DROP TRIGGER IF EXISTS on_storage_object_created ON storage.objects;

-- Then drop the function
DROP FUNCTION IF EXISTS public.trigger_thumbnail_generation();

-- Optional: If you want to disable the pg_net extension (only if you are sure you don't need it for anything else)
-- DROP EXTENSION IF EXISTS pg_net;
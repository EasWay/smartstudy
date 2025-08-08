-- Enable pg_net extension if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function to send HTTP POST request to Supabase Function
CREATE OR REPLACE FUNCTION public.trigger_thumbnail_generation()
RETURNS TRIGGER AS $$
DECLARE
    function_url TEXT;
    payload JSONB;
    response_body TEXT;
    response_status_code INT;
BEGIN
    -- IMPORTANT: Replace <YOUR_PROJECT_REF> with your actual Supabase project reference.
    -- You can find your project ref in your Supabase project settings.
    function_url := 'https://vmrwfbkahlsjetgqhoof.supabase.co/functions/v1/generate-thumbnail';

    -- Construct the payload similar to what a Storage Webhook sends
    payload := jsonb_build_object(
        'type', 'INSERT', -- Or 'UPDATE' if you want to trigger on updates too
        'table', 'objects',
        'record', jsonb_build_object(
            'id', NEW.id,
            'bucket_id', NEW.bucket_id,
            'name', NEW.name,
            'path_tokens', NEW.path_tokens,
            'created_at', NEW.created_at,
            'updated_at', NEW.updated_at,
            'last_accessed_at', NEW.last_accessed_at,
            'metadata', NEW.metadata,
            'owner', NEW.owner,
            'version', NEW.version
        )
    );

    -- Send the POST request using pg_net
    SELECT
        net.http_post(
            function_url,
            payload::text,
            ARRAY[net.http_header('Content-Type', 'application/json')]
        )
    INTO
        response_body, response_status_code;

    RAISE NOTICE 'Thumbnail generation function call response: Status % Body %', response_status_code, response_body;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger on storage.objects
-- This trigger will fire AFTER a new object is inserted into the storage.objects table
CREATE TRIGGER on_storage_object_created
AFTER INSERT ON storage.objects
FOR EACH ROW
WHEN (NEW.bucket_id = 'edresources') -- Only trigger for the 'edresources' bucket
EXECUTE FUNCTION public.trigger_thumbnail_generation();

-- IMPORTANT NOTES:
-- 1. Replace <YOUR_PROJECT_REF> with your actual Supabase project reference.
-- 2. This method is a workaround. The standard way to trigger Supabase Functions
--    from Storage events is via Storage Webhooks in the Supabase Dashboard.
--    If you can find the Webhooks tab under Storage -> [Your Bucket] -> Webhooks,
--    that is the preferred and more reliable method.
-- 3. Ensure 'pg_net' extension is enabled in your Supabase project.
-- 4. Permissions: The 'SECURITY DEFINER' clause on the function is crucial for it to execute
--    with the privileges of the user who created it (e.g., 'supabase_admin').
-- 5. Error Handling: This script has basic error logging. For production,
--    you might want more robust error handling and retry mechanisms.
-- 6. The payload sent to the function mimics the Storage Webhook payload.
--    Ensure your Supabase Function is set up to parse this JSON structure.

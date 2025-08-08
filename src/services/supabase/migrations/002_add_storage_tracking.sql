-- Migration: Add storage tracking columns to profiles table
-- This migration adds storage usage and limit tracking to user profiles

-- Add storage tracking columns to profiles table
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS storage_used BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS storage_limit BIGINT DEFAULT 104857600; -- 100MB default limit

-- Add comments for documentation
COMMENT ON COLUMN profiles.storage_used IS 'Current storage usage in bytes';
COMMENT ON COLUMN profiles.storage_limit IS 'Storage limit in bytes (default 100MB)';

-- Create index for efficient storage queries
CREATE INDEX IF NOT EXISTS idx_profiles_storage_usage ON profiles(storage_used);

-- Update existing profiles to have default storage values (if any exist)
UPDATE profiles 
SET storage_used = 0, storage_limit = 104857600 
WHERE storage_used IS NULL OR storage_limit IS NULL;
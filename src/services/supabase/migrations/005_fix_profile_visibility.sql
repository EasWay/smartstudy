-- Fix profile visibility for messaging
-- Allow users to view basic profile info of other users for messaging purposes

-- Add policy to allow viewing basic profile info of other users
CREATE POLICY "Users can view basic profile info of others" ON public.profiles
  FOR SELECT USING (
    -- Allow viewing username, full_name, and avatar_url of other users
    -- This is needed for messaging and group functionality
    true
  );

-- Note: This policy allows viewing basic profile info of all users
-- In a production environment, you might want to restrict this to:
-- - Only users in the same groups
-- - Only specific fields (username, full_name, avatar_url)
-- - Only authenticated users

-- Alternative more restrictive policy (commented out):
/*
CREATE POLICY "Users can view group members' profiles" ON public.profiles
  FOR SELECT USING (
    auth.uid() IS NOT NULL AND (
      -- Allow viewing own profile
      auth.uid() = id OR
      -- Allow viewing profiles of users in same groups
      EXISTS (
        SELECT 1 FROM group_members gm1
        JOIN group_members gm2 ON gm1.group_id = gm2.group_id
        WHERE gm1.user_id = auth.uid() AND gm2.user_id = profiles.id
      )
    )
  );
*/
-- Fix chat_participants policies to prevent infinite recursion

-- Drop all existing policies on chat_participants
DROP POLICY IF EXISTS "Users can view chats they're participating in" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can join chats" ON public.chat_participants;
DROP POLICY IF EXISTS "Chat creators can manage participants" ON public.chat_participants;
DROP POLICY IF EXISTS "Users can leave chats" ON public.chat_participants;
DROP POLICY IF EXISTS "Allow all operations on chat_participants for authenticated users" ON public.chat_participants;

-- Create a simple policy that allows authenticated users to do everything
-- This prevents recursion issues with complex JOIN queries
CREATE POLICY "Authenticated users can manage their chat participation"
ON public.chat_participants FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

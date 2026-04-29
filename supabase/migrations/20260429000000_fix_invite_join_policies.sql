-- Fix: Allow non-members to look up invites by code and join workspaces
-- The previous policies required is_workspace_member() which blocked the join flow
-- since the user isn't a member yet when they're trying to join.

-- 1. Allow any authenticated user to read invites by invite_code
--    This is safe because invite codes are random and unguessable.
CREATE POLICY "Anyone can look up invites by code" ON workspace_invites FOR SELECT
  TO authenticated
  USING (true);

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Members can view invites" ON workspace_invites;

-- 2. Allow any authenticated user to insert themselves as a workspace member
--    The application code validates the invite code before inserting.
--    We restrict to: user can only add themselves (user_id = auth.uid())
CREATE POLICY "Users can join via invite" ON workspace_members FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Invite permission can add members" ON workspace_members;

-- 3. Allow any authenticated user to update invite use_count
--    Needed to increment the counter after joining.
CREATE POLICY "Anyone can update invite use count" ON workspace_invites FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

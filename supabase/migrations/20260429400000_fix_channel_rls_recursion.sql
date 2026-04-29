-- ============================================================
-- Fix circular RLS dependency between channels and channel_members
--
-- channels SELECT policy references channel_members table
-- channel_members SELECT policy references channels table
-- This causes infinite recursion → 500 errors on PostgREST
--
-- Fix: wrap cross-table lookups in SECURITY DEFINER functions
-- which bypass RLS, breaking the circular dependency.
-- ============================================================

-- Helper: check if the current user is a member of a specific channel
-- Used by channels SELECT policy (replaces direct channel_members query)
CREATE OR REPLACE FUNCTION is_channel_member(ch_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM channel_members cm
    JOIN workspace_members wm ON wm.id = cm.member_id
    WHERE cm.channel_id = ch_id AND wm.user_id = auth.uid()
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check if the current user is a workspace member for a given channel
-- Used by channel_members SELECT/INSERT policies (replaces direct channels query)
CREATE OR REPLACE FUNCTION is_channel_workspace_member(ch_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM channels c
    WHERE c.id = ch_id AND is_workspace_member(c.workspace_id)
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Recreate channels SELECT policy using the helper function
DROP POLICY IF EXISTS "Members can view channels" ON channels;
CREATE POLICY "Members can view channels" ON channels FOR SELECT
  USING (
    (type IN ('public', 'project') AND is_workspace_member(workspace_id))
    OR is_channel_member(id)
  );

-- Recreate channel_members SELECT policy using the helper function
DROP POLICY IF EXISTS "Members can view channel members" ON channel_members;
CREATE POLICY "Members can view channel members" ON channel_members FOR SELECT
  USING (is_channel_workspace_member(channel_id));

-- Recreate channel_members INSERT policy using the helper function
DROP POLICY IF EXISTS "Members can join/be added" ON channel_members;
CREATE POLICY "Members can join/be added" ON channel_members FOR INSERT
  WITH CHECK (is_channel_workspace_member(channel_id));

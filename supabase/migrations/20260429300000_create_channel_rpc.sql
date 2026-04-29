-- ============================================================
-- RPC: Atomic channel creation with owner membership
-- Fixes: SELECT-after-INSERT RLS conflict for private channels
-- ============================================================

CREATE OR REPLACE FUNCTION create_channel_with_owner(
  p_workspace_id UUID,
  p_name TEXT,
  p_type TEXT,
  p_created_by UUID,
  p_description TEXT DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  new_channel channels;
BEGIN
  -- Verify caller has permission
  IF NOT has_permission(p_workspace_id, 'chat.create_channel') THEN
    RAISE EXCEPTION 'You do not have permission to create channels'
      USING ERRCODE = '42501';
  END IF;

  -- Insert the channel
  INSERT INTO channels (workspace_id, name, type, created_by, description)
  VALUES (p_workspace_id, p_name, p_type, p_created_by, p_description)
  RETURNING * INTO new_channel;

  -- Add the creator as channel owner
  INSERT INTO channel_members (channel_id, member_id, role)
  VALUES (new_channel.id, p_created_by, 'owner');

  RETURN row_to_json(new_channel);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

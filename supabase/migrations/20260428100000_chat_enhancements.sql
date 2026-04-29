-- ============================================================
-- Phase 2: Chat Enhancements
-- ============================================================

-- Add last_message_at to channels for efficient unread calculation
ALTER TABLE channels ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ;

-- Trigger: update channel.last_message_at on new message
CREATE OR REPLACE FUNCTION update_channel_last_message()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE channels SET last_message_at = NEW.created_at
    WHERE id = NEW.channel_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_channel_last_message
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION update_channel_last_message();

-- Trigger: auto-create project channel when project is created
CREATE OR REPLACE FUNCTION create_project_channel()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO channels (workspace_id, name, description, type, created_by, project_id)
  VALUES (
    NEW.workspace_id,
    NEW.slug,
    'Channel for project: ' || NEW.name,
    'project',
    NEW.created_by,
    NEW.id
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_project_created_channel
  AFTER INSERT ON projects
  FOR EACH ROW EXECUTE FUNCTION create_project_channel();

-- Trigger: create notifications for @mentions in messages
CREATE OR REPLACE FUNCTION notify_message_mentions()
RETURNS TRIGGER AS $$
DECLARE
  mentioned_user_id UUID;
  sender_name TEXT;
  channel_ws_id UUID;
BEGIN
  -- Skip if no mentions
  IF NEW.mentions IS NULL OR array_length(NEW.mentions, 1) IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get sender name and workspace
  SELECT wm.display_name, c.workspace_id
    INTO sender_name, channel_ws_id
    FROM workspace_members wm
    JOIN channels c ON c.id = NEW.channel_id
    WHERE wm.id = NEW.sender_id;

  -- Create notification for each mentioned member
  FOR mentioned_user_id IN
    SELECT wm.user_id FROM workspace_members wm
    WHERE wm.id = ANY(NEW.mentions)
    AND wm.id != NEW.sender_id
  LOOP
    INSERT INTO notifications (workspace_id, user_id, type, title, body, entity_type, entity_id)
    VALUES (
      channel_ws_id,
      mentioned_user_id,
      'chat_mention',
      COALESCE(sender_name, 'Someone') || ' mentioned you in chat',
      LEFT(NEW.content, 200),
      'channel',
      NEW.channel_id
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_message_mentions
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION notify_message_mentions();

-- Enable realtime on channel_members for presence-aware unread
ALTER PUBLICATION supabase_realtime ADD TABLE channel_members;

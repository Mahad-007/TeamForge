-- ============================================================
-- TeamForge Initial Schema
-- 26 tables + triggers + RLS policies + functions
-- ============================================================

-- ============================================================
-- PROFILES (extends Supabase auth.users)
-- ============================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  bio TEXT,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- WORKSPACES
-- ============================================================
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  owner_id UUID NOT NULL REFERENCES auth.users(id),
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_workspaces_slug ON workspaces(slug);
CREATE INDEX idx_workspaces_owner ON workspaces(owner_id);

-- ============================================================
-- ROLES
-- ============================================================
CREATE TABLE public.roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT DEFAULT '#6366f1',
  permissions JSONB NOT NULL DEFAULT '{}',
  is_default BOOLEAN DEFAULT false,
  position INTEGER NOT NULL DEFAULT 0,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_roles_workspace ON roles(workspace_id);
CREATE UNIQUE INDEX idx_roles_workspace_name ON roles(workspace_id, name);

-- ============================================================
-- WORKSPACE MEMBERS
-- ============================================================
CREATE TABLE public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id),
  display_name TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deactivated', 'invited')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

CREATE INDEX idx_members_workspace ON workspace_members(workspace_id);
CREATE INDEX idx_members_user ON workspace_members(user_id);

-- ============================================================
-- WORKSPACE INVITES
-- ============================================================
CREATE TABLE public.workspace_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email TEXT,
  invite_code TEXT NOT NULL UNIQUE,
  role_id UUID NOT NULL REFERENCES roles(id),
  invited_by UUID NOT NULL REFERENCES workspace_members(id),
  expires_at TIMESTAMPTZ,
  max_uses INTEGER,
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- PROJECTS
-- ============================================================
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'paused', 'completed', 'archived')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  start_date DATE,
  target_date DATE,
  created_by UUID NOT NULL REFERENCES workspace_members(id),
  lead_id UUID REFERENCES workspace_members(id),
  github_repo_url TEXT,
  github_repo_id BIGINT,
  settings JSONB DEFAULT '{"statuses": ["Backlog", "Todo", "In Progress", "Review", "Done"], "labels": []}',
  task_counter INTEGER DEFAULT 0,
  bug_counter INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(workspace_id, slug)
);

CREATE INDEX idx_projects_workspace ON projects(workspace_id);

-- ============================================================
-- PROJECT MEMBERS
-- ============================================================
CREATE TABLE public.project_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES workspace_members(id) ON DELETE CASCADE,
  project_role TEXT NOT NULL DEFAULT 'member' CHECK (project_role IN ('lead', 'member', 'viewer')),
  added_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, member_id)
);

-- ============================================================
-- LABELS
-- ============================================================
CREATE TABLE public.labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  UNIQUE(workspace_id, project_id, name)
);

-- ============================================================
-- TASKS
-- ============================================================
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  parent_task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'Backlog',
  priority TEXT NOT NULL DEFAULT 'none' CHECK (priority IN ('none', 'low', 'medium', 'high', 'urgent')),
  type TEXT NOT NULL DEFAULT 'task' CHECK (type IN ('epic', 'story', 'task', 'subtask')),
  assignee_id UUID REFERENCES workspace_members(id) ON DELETE SET NULL,
  reporter_id UUID NOT NULL REFERENCES workspace_members(id),
  labels TEXT[] DEFAULT '{}',
  due_date TIMESTAMPTZ,
  estimated_hours DECIMAL(6,2),
  actual_hours DECIMAL(6,2),
  sort_order INTEGER DEFAULT 0,
  identifier TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX idx_tasks_project_status ON tasks(workspace_id, project_id, status);
CREATE INDEX idx_tasks_assignee ON tasks(assignee_id, status);
CREATE INDEX idx_tasks_identifier ON tasks(identifier);
CREATE INDEX idx_tasks_parent ON tasks(parent_task_id);
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;

-- Full-text search index for tasks
ALTER TABLE tasks ADD COLUMN fts tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))) STORED;
CREATE INDEX idx_tasks_fts ON tasks USING gin(fts);

-- ============================================================
-- TASK COMMENTS
-- ============================================================
CREATE TABLE public.task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES workspace_members(id),
  content TEXT NOT NULL,
  parent_comment_id UUID REFERENCES task_comments(id) ON DELETE CASCADE,
  mentions UUID[] DEFAULT '{}',
  is_edited BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  edited_at TIMESTAMPTZ
);

CREATE INDEX idx_comments_task ON task_comments(task_id, created_at);

-- ============================================================
-- TASK ACTIVITY LOG
-- ============================================================
CREATE TABLE public.task_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  actor_id UUID NOT NULL REFERENCES workspace_members(id),
  action TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_activity_task ON task_activity_log(task_id, created_at DESC);

-- ============================================================
-- BUGS
-- ============================================================
CREATE TABLE public.bugs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'confirmed', 'in_progress', 'fixed', 'closed', 'wont_fix')),
  severity TEXT NOT NULL DEFAULT 'minor' CHECK (severity IN ('cosmetic', 'minor', 'major', 'critical', 'blocker')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  assignee_id UUID REFERENCES workspace_members(id) ON DELETE SET NULL,
  reporter_id UUID NOT NULL REFERENCES workspace_members(id),
  related_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
  environment TEXT,
  identifier TEXT NOT NULL DEFAULT '',
  attachments TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_bugs_project ON bugs(workspace_id, project_id, status);
CREATE INDEX idx_bugs_identifier ON bugs(identifier);
CREATE INDEX idx_bugs_severity ON bugs(project_id, severity);

-- ============================================================
-- CHANNELS
-- ============================================================
CREATE TABLE public.channels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'public' CHECK (type IN ('public', 'private', 'dm', 'project')),
  created_by UUID NOT NULL REFERENCES workspace_members(id),
  is_archived BOOLEAN DEFAULT false,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_channels_workspace ON channels(workspace_id, type);

-- ============================================================
-- CHANNEL MEMBERS
-- ============================================================
CREATE TABLE public.channel_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES workspace_members(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  last_read_at TIMESTAMPTZ DEFAULT now(),
  notifications TEXT NOT NULL DEFAULT 'all' CHECK (notifications IN ('all', 'mentions', 'none')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(channel_id, member_id)
);

CREATE INDEX idx_channel_members_channel ON channel_members(channel_id);
CREATE INDEX idx_channel_members_member ON channel_members(member_id);

-- ============================================================
-- MESSAGES
-- ============================================================
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id UUID NOT NULL REFERENCES channels(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES workspace_members(id),
  content TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text' CHECK (type IN ('text', 'system', 'ai_response')),
  thread_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  attachments JSONB DEFAULT '[]',
  mentions UUID[] DEFAULT '{}',
  reactions JSONB DEFAULT '{}',
  is_edited BOOLEAN DEFAULT false,
  is_deleted BOOLEAN DEFAULT false,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  edited_at TIMESTAMPTZ
);

CREATE INDEX idx_messages_channel ON messages(channel_id, created_at DESC);
CREATE INDEX idx_messages_thread ON messages(thread_id, created_at) WHERE thread_id IS NOT NULL;

-- Full-text search for messages
ALTER TABLE messages ADD COLUMN fts tsvector
  GENERATED ALWAYS AS (to_tsvector('english', coalesce(content, ''))) STORED;
CREATE INDEX idx_messages_fts ON messages USING gin(fts);

-- ============================================================
-- WIKI PAGES
-- ============================================================
CREATE TABLE public.wiki_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  parent_page_id UUID REFERENCES wiki_pages(id) ON DELETE SET NULL,
  title TEXT NOT NULL DEFAULT 'Untitled',
  content JSONB DEFAULT '[]',
  icon TEXT,
  cover_url TEXT,
  created_by UUID NOT NULL REFERENCES workspace_members(id),
  last_edited_by UUID NOT NULL REFERENCES workspace_members(id),
  is_template BOOLEAN DEFAULT false,
  is_archived BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_wiki_pages_tree ON wiki_pages(workspace_id, project_id, parent_page_id);

-- ============================================================
-- WIKI PAGE VERSIONS
-- ============================================================
CREATE TABLE public.wiki_page_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID NOT NULL REFERENCES wiki_pages(id) ON DELETE CASCADE,
  content JSONB NOT NULL,
  title TEXT NOT NULL,
  edited_by UUID NOT NULL REFERENCES workspace_members(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_wiki_versions_page ON wiki_page_versions(page_id, created_at DESC);

-- ============================================================
-- REPOSITORY SCANS
-- ============================================================
CREATE TABLE public.repository_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  triggered_by UUID NOT NULL REFERENCES workspace_members(id),
  trigger_type TEXT NOT NULL DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'scheduled', 'webhook')),
  status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'running', 'completed', 'failed')),
  branch TEXT DEFAULT 'main',
  commit_sha TEXT,
  results JSONB,
  error_message TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_scans_project ON repository_scans(project_id, created_at DESC);

-- ============================================================
-- NOTIFICATIONS
-- ============================================================
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT,
  entity_type TEXT,
  entity_id UUID,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_notifications_user ON notifications(user_id, is_read, created_at DESC);

-- ============================================================
-- NOTIFICATION PREFERENCES
-- ============================================================
CREATE TABLE public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  preferences JSONB NOT NULL DEFAULT '{}',
  UNIQUE(user_id, workspace_id)
);

-- ============================================================
-- AI CONVERSATIONS
-- ============================================================
CREATE TABLE public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT DEFAULT 'New Conversation',
  context_type TEXT DEFAULT 'global' CHECK (context_type IN ('global', 'project', 'task', 'bug', 'wiki')),
  context_id UUID,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ai_conversations_user ON ai_conversations(user_id, workspace_id, created_at DESC);

-- ============================================================
-- AI MESSAGES
-- ============================================================
CREATE TABLE public.ai_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ai_messages_conversation ON ai_messages(conversation_id, created_at);

-- ============================================================
-- API KEYS
-- ============================================================
CREATE TABLE public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES workspace_members(id),
  name TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  key_prefix TEXT NOT NULL,
  permissions JSONB DEFAULT '{"all": true}',
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_api_keys_workspace ON api_keys(workspace_id);
CREATE INDEX idx_api_keys_prefix ON api_keys(key_prefix);

-- ============================================================
-- REMINDERS
-- ============================================================
CREATE TABLE public.reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  remind_at TIMESTAMPTZ NOT NULL,
  is_sent BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_reminders_pending ON reminders(remind_at) WHERE is_sent = false;

-- ============================================================
-- WEBHOOKS (Outbound)
-- ============================================================
CREATE TABLE public.webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_by UUID NOT NULL REFERENCES workspace_members(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- SAVED VIEWS
-- ============================================================
CREATE TABLE public.saved_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES workspace_members(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'task' CHECK (type IN ('task', 'bug')),
  filters JSONB NOT NULL DEFAULT '{}',
  sort JSONB DEFAULT '{}',
  is_shared BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- FUNCTIONS
-- ============================================================

-- Auto-increment task identifier on insert
CREATE OR REPLACE FUNCTION generate_task_identifier()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects SET task_counter = task_counter + 1
    WHERE id = NEW.project_id;

  SELECT slug INTO NEW.identifier FROM projects WHERE id = NEW.project_id;
  NEW.identifier := UPPER(NEW.identifier) || '-' || (
    SELECT task_counter FROM projects WHERE id = NEW.project_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_task_identifier
  BEFORE INSERT ON tasks
  FOR EACH ROW EXECUTE FUNCTION generate_task_identifier();

-- Auto-increment bug identifier on insert
CREATE OR REPLACE FUNCTION generate_bug_identifier()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects SET bug_counter = bug_counter + 1
    WHERE id = NEW.project_id;

  NEW.identifier := 'BUG-' || (
    SELECT bug_counter FROM projects WHERE id = NEW.project_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_bug_identifier
  BEFORE INSERT ON bugs
  FOR EACH ROW EXECUTE FUNCTION generate_bug_identifier();

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_wiki_pages_updated_at
  BEFORE UPDATE ON wiki_pages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Auto-set completed_at when task reaches final status
CREATE OR REPLACE FUNCTION handle_task_completion()
RETURNS TRIGGER AS $$
DECLARE
  project_statuses JSONB;
  last_status TEXT;
BEGIN
  SELECT settings->'statuses' INTO project_statuses
    FROM projects WHERE id = NEW.project_id;

  last_status := project_statuses->>((jsonb_array_length(project_statuses) - 1)::int);

  IF NEW.status = last_status AND OLD.status != last_status THEN
    NEW.completed_at = now();
  ELSIF NEW.status != last_status AND OLD.completed_at IS NOT NULL THEN
    NEW.completed_at = NULL;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_task_completion
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION handle_task_completion();

-- Create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Create default roles when workspace is created
CREATE OR REPLACE FUNCTION create_default_roles()
RETURNS TRIGGER AS $$
DECLARE
  owner_role_id UUID;
  owner_member_id UUID;
BEGIN
  -- Owner role
  INSERT INTO roles (workspace_id, name, color, permissions, position, is_system)
  VALUES (NEW.id, 'Owner', '#ef4444',
    '{"workspace.manage":true,"workspace.invite":true,"workspace.remove_members":true,"workspace.manage_roles":true,"workspace.manage_billing":true,"workspace.manage_integrations":true,"projects.create":true,"projects.delete":true,"projects.manage":true,"projects.view_all":true,"tasks.create":true,"tasks.assign":true,"tasks.delete":true,"tasks.manage_all":true,"tasks.change_status":true,"bugs.create":true,"bugs.assign":true,"bugs.delete":true,"bugs.manage_all":true,"chat.create_channel":true,"chat.manage_channels":true,"chat.send_messages":true,"chat.delete_any_message":true,"wiki.create":true,"wiki.edit_all":true,"wiki.delete":true,"wiki.manage":true,"code.manage_repos":true,"code.trigger_scan":true,"code.view_reports":true,"ai.use_assistant":true,"ai.view_analytics":true}'::jsonb,
    0, true)
  RETURNING id INTO owner_role_id;

  -- Admin role
  INSERT INTO roles (workspace_id, name, color, permissions, position, is_system)
  VALUES (NEW.id, 'Admin', '#f97316',
    '{"workspace.manage":true,"workspace.invite":true,"workspace.remove_members":true,"workspace.manage_roles":true,"workspace.manage_billing":false,"workspace.manage_integrations":true,"projects.create":true,"projects.delete":true,"projects.manage":true,"projects.view_all":true,"tasks.create":true,"tasks.assign":true,"tasks.delete":true,"tasks.manage_all":true,"tasks.change_status":true,"bugs.create":true,"bugs.assign":true,"bugs.delete":true,"bugs.manage_all":true,"chat.create_channel":true,"chat.manage_channels":true,"chat.send_messages":true,"chat.delete_any_message":true,"wiki.create":true,"wiki.edit_all":true,"wiki.delete":true,"wiki.manage":true,"code.manage_repos":true,"code.trigger_scan":true,"code.view_reports":true,"ai.use_assistant":true,"ai.view_analytics":true}'::jsonb,
    1, true);

  -- Manager role
  INSERT INTO roles (workspace_id, name, color, permissions, position, is_system)
  VALUES (NEW.id, 'Manager', '#eab308',
    '{"workspace.manage":false,"workspace.invite":true,"workspace.remove_members":false,"workspace.manage_roles":false,"workspace.manage_billing":false,"workspace.manage_integrations":false,"projects.create":true,"projects.delete":false,"projects.manage":true,"projects.view_all":true,"tasks.create":true,"tasks.assign":true,"tasks.delete":true,"tasks.manage_all":true,"tasks.change_status":true,"bugs.create":true,"bugs.assign":true,"bugs.delete":true,"bugs.manage_all":true,"chat.create_channel":true,"chat.manage_channels":true,"chat.send_messages":true,"chat.delete_any_message":false,"wiki.create":true,"wiki.edit_all":true,"wiki.delete":true,"wiki.manage":true,"code.manage_repos":true,"code.trigger_scan":true,"code.view_reports":true,"ai.use_assistant":true,"ai.view_analytics":true}'::jsonb,
    2, true);

  -- Member role (default)
  INSERT INTO roles (workspace_id, name, color, permissions, is_default, position, is_system)
  VALUES (NEW.id, 'Member', '#22c55e',
    '{"workspace.manage":false,"workspace.invite":false,"workspace.remove_members":false,"workspace.manage_roles":false,"workspace.manage_billing":false,"workspace.manage_integrations":false,"projects.create":false,"projects.delete":false,"projects.manage":false,"projects.view_all":false,"tasks.create":true,"tasks.assign":false,"tasks.delete":false,"tasks.manage_all":false,"tasks.change_status":true,"bugs.create":true,"bugs.assign":false,"bugs.delete":false,"bugs.manage_all":false,"chat.create_channel":false,"chat.manage_channels":false,"chat.send_messages":true,"chat.delete_any_message":false,"wiki.create":true,"wiki.edit_all":false,"wiki.delete":false,"wiki.manage":false,"code.manage_repos":false,"code.trigger_scan":false,"code.view_reports":true,"ai.use_assistant":true,"ai.view_analytics":false}'::jsonb,
    true, 3, true);

  -- Viewer role
  INSERT INTO roles (workspace_id, name, color, permissions, position, is_system)
  VALUES (NEW.id, 'Viewer', '#6b7280',
    '{"workspace.manage":false,"workspace.invite":false,"workspace.remove_members":false,"workspace.manage_roles":false,"workspace.manage_billing":false,"workspace.manage_integrations":false,"projects.create":false,"projects.delete":false,"projects.manage":false,"projects.view_all":true,"tasks.create":false,"tasks.assign":false,"tasks.delete":false,"tasks.manage_all":false,"tasks.change_status":false,"bugs.create":false,"bugs.assign":false,"bugs.delete":false,"bugs.manage_all":false,"chat.create_channel":false,"chat.manage_channels":false,"chat.send_messages":true,"chat.delete_any_message":false,"wiki.create":false,"wiki.edit_all":false,"wiki.delete":false,"wiki.manage":false,"code.manage_repos":false,"code.trigger_scan":false,"code.view_reports":true,"ai.use_assistant":true,"ai.view_analytics":false}'::jsonb,
    4, true);

  -- Auto-add workspace creator as Owner
  INSERT INTO workspace_members (workspace_id, user_id, role_id)
  VALUES (NEW.id, NEW.owner_id, owner_role_id)
  RETURNING id INTO owner_member_id;

  -- Create default #general channel
  INSERT INTO channels (workspace_id, name, description, type, created_by)
  VALUES (NEW.id, 'general', 'General discussion for everyone', 'public', owner_member_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_workspace_created
  AFTER INSERT ON workspaces
  FOR EACH ROW EXECUTE FUNCTION create_default_roles();

-- ============================================================
-- ROW-LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE labels ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE bugs ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE wiki_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE wiki_page_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE repository_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_views ENABLE ROW LEVEL SECURITY;

-- Helper: check workspace membership
CREATE OR REPLACE FUNCTION is_workspace_member(ws_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = ws_id
    AND user_id = auth.uid()
    AND status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: check permission
CREATE OR REPLACE FUNCTION has_permission(ws_id UUID, perm TEXT)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM workspace_members wm
    JOIN roles r ON r.id = wm.role_id
    WHERE wm.workspace_id = ws_id
    AND wm.user_id = auth.uid()
    AND wm.status = 'active'
    AND (r.permissions->>perm)::boolean = true
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Profiles
CREATE POLICY "Users can view any profile" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (id = auth.uid());

-- Workspaces
CREATE POLICY "Members can view their workspaces" ON workspaces FOR SELECT
  USING (is_workspace_member(id));
CREATE POLICY "Authenticated users can create workspaces" ON workspaces FOR INSERT
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owners can update workspaces" ON workspaces FOR UPDATE
  USING (owner_id = auth.uid());

-- Workspace Members
CREATE POLICY "Members can view workspace members" ON workspace_members FOR SELECT
  USING (is_workspace_member(workspace_id));
CREATE POLICY "Invite permission can add members" ON workspace_members FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY "Manage permission can update members" ON workspace_members FOR UPDATE
  USING (has_permission(workspace_id, 'workspace.manage_roles'));
CREATE POLICY "Remove permission can delete members" ON workspace_members FOR DELETE
  USING (has_permission(workspace_id, 'workspace.remove_members'));

-- Workspace Invites
CREATE POLICY "Members can view invites" ON workspace_invites FOR SELECT
  USING (is_workspace_member(workspace_id));
CREATE POLICY "Invite permission can create invites" ON workspace_invites FOR INSERT
  WITH CHECK (has_permission(workspace_id, 'workspace.invite'));

-- Roles
CREATE POLICY "Members can view roles" ON roles FOR SELECT
  USING (is_workspace_member(workspace_id));
CREATE POLICY "Role managers can create roles" ON roles FOR INSERT
  WITH CHECK (has_permission(workspace_id, 'workspace.manage_roles'));
CREATE POLICY "Role managers can update roles" ON roles FOR UPDATE
  USING (has_permission(workspace_id, 'workspace.manage_roles') AND is_system = false);
CREATE POLICY "Role managers can delete roles" ON roles FOR DELETE
  USING (has_permission(workspace_id, 'workspace.manage_roles') AND is_system = false);

-- Projects
CREATE POLICY "Members can view projects" ON projects FOR SELECT
  USING (is_workspace_member(workspace_id));
CREATE POLICY "Permitted users can create projects" ON projects FOR INSERT
  WITH CHECK (has_permission(workspace_id, 'projects.create'));
CREATE POLICY "Permitted users can update projects" ON projects FOR UPDATE
  USING (has_permission(workspace_id, 'projects.manage'));
CREATE POLICY "Permitted users can delete projects" ON projects FOR DELETE
  USING (has_permission(workspace_id, 'projects.delete'));

-- Project Members
CREATE POLICY "Members can view project members" ON project_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects p WHERE p.id = project_id AND is_workspace_member(p.workspace_id)
  ));
CREATE POLICY "Project managers can add members" ON project_members FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects p WHERE p.id = project_id AND has_permission(p.workspace_id, 'projects.manage')
  ));

-- Labels
CREATE POLICY "Members can view labels" ON labels FOR SELECT
  USING (is_workspace_member(workspace_id));
CREATE POLICY "Members can manage labels" ON labels FOR ALL
  USING (is_workspace_member(workspace_id));

-- Tasks
CREATE POLICY "Members can view tasks" ON tasks FOR SELECT
  USING (is_workspace_member(workspace_id));
CREATE POLICY "Permitted users can create tasks" ON tasks FOR INSERT
  WITH CHECK (has_permission(workspace_id, 'tasks.create'));
CREATE POLICY "Users can update own or managed tasks" ON tasks FOR UPDATE
  USING (
    has_permission(workspace_id, 'tasks.manage_all')
    OR assignee_id = (SELECT id FROM workspace_members WHERE user_id = auth.uid() AND workspace_id = tasks.workspace_id)
    OR reporter_id = (SELECT id FROM workspace_members WHERE user_id = auth.uid() AND workspace_id = tasks.workspace_id)
  );
CREATE POLICY "Permitted users can delete tasks" ON tasks FOR DELETE
  USING (has_permission(workspace_id, 'tasks.delete'));

-- Task Comments
CREATE POLICY "Members can view comments" ON task_comments FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM tasks t WHERE t.id = task_id AND is_workspace_member(t.workspace_id)
  ));
CREATE POLICY "Members can create comments" ON task_comments FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM tasks t WHERE t.id = task_id AND is_workspace_member(t.workspace_id)
  ));
CREATE POLICY "Authors can update own comments" ON task_comments FOR UPDATE
  USING (author_id = (SELECT id FROM workspace_members WHERE user_id = auth.uid() LIMIT 1));

-- Task Activity Log
CREATE POLICY "Members can view activity" ON task_activity_log FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM tasks t WHERE t.id = task_id AND is_workspace_member(t.workspace_id)
  ));
CREATE POLICY "Members can log activity" ON task_activity_log FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM tasks t WHERE t.id = task_id AND is_workspace_member(t.workspace_id)
  ));

-- Bugs
CREATE POLICY "Members can view bugs" ON bugs FOR SELECT
  USING (is_workspace_member(workspace_id));
CREATE POLICY "Permitted users can create bugs" ON bugs FOR INSERT
  WITH CHECK (has_permission(workspace_id, 'bugs.create'));
CREATE POLICY "Users can update own or managed bugs" ON bugs FOR UPDATE
  USING (
    has_permission(workspace_id, 'bugs.manage_all')
    OR assignee_id = (SELECT id FROM workspace_members WHERE user_id = auth.uid() AND workspace_id = bugs.workspace_id)
    OR reporter_id = (SELECT id FROM workspace_members WHERE user_id = auth.uid() AND workspace_id = bugs.workspace_id)
  );
CREATE POLICY "Permitted users can delete bugs" ON bugs FOR DELETE
  USING (has_permission(workspace_id, 'bugs.delete'));

-- Channels
CREATE POLICY "Members can view channels" ON channels FOR SELECT
  USING (
    (type IN ('public', 'project') AND is_workspace_member(workspace_id))
    OR EXISTS (
      SELECT 1 FROM channel_members cm
      JOIN workspace_members wm ON wm.id = cm.member_id
      WHERE cm.channel_id = channels.id AND wm.user_id = auth.uid()
    )
  );
CREATE POLICY "Permitted users can create channels" ON channels FOR INSERT
  WITH CHECK (has_permission(workspace_id, 'chat.create_channel'));
CREATE POLICY "Channel managers can update" ON channels FOR UPDATE
  USING (has_permission(workspace_id, 'chat.manage_channels'));

-- Channel Members
CREATE POLICY "Members can view channel members" ON channel_members FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM channels c WHERE c.id = channel_id AND is_workspace_member(c.workspace_id)
  ));
CREATE POLICY "Members can join/be added" ON channel_members FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM channels c WHERE c.id = channel_id AND is_workspace_member(c.workspace_id)
  ));
CREATE POLICY "Members can update own preferences" ON channel_members FOR UPDATE
  USING (member_id = (SELECT id FROM workspace_members WHERE user_id = auth.uid() LIMIT 1));

-- Messages
CREATE POLICY "Channel members can view messages" ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM channel_members cm
      JOIN workspace_members wm ON wm.id = cm.member_id
      WHERE cm.channel_id = messages.channel_id AND wm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM channels c
      WHERE c.id = messages.channel_id AND c.type = 'public' AND is_workspace_member(c.workspace_id)
    )
  );
CREATE POLICY "Permitted users can send messages" ON messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM channels c WHERE c.id = channel_id AND has_permission(c.workspace_id, 'chat.send_messages')
  ));
CREATE POLICY "Senders can update own messages" ON messages FOR UPDATE
  USING (sender_id = (SELECT id FROM workspace_members WHERE user_id = auth.uid() LIMIT 1));

-- Wiki Pages
CREATE POLICY "Members can view wiki pages" ON wiki_pages FOR SELECT
  USING (is_workspace_member(workspace_id));
CREATE POLICY "Permitted users can create pages" ON wiki_pages FOR INSERT
  WITH CHECK (has_permission(workspace_id, 'wiki.create'));
CREATE POLICY "Permitted users can update pages" ON wiki_pages FOR UPDATE
  USING (
    has_permission(workspace_id, 'wiki.edit_all')
    OR created_by = (SELECT id FROM workspace_members WHERE user_id = auth.uid() AND workspace_id = wiki_pages.workspace_id)
  );
CREATE POLICY "Permitted users can delete pages" ON wiki_pages FOR DELETE
  USING (has_permission(workspace_id, 'wiki.delete'));

-- Wiki Page Versions
CREATE POLICY "Members can view versions" ON wiki_page_versions FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM wiki_pages wp WHERE wp.id = page_id AND is_workspace_member(wp.workspace_id)
  ));
CREATE POLICY "Members can create versions" ON wiki_page_versions FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM wiki_pages wp WHERE wp.id = page_id AND is_workspace_member(wp.workspace_id)
  ));

-- Repository Scans
CREATE POLICY "Members can view scans" ON repository_scans FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM projects p WHERE p.id = project_id AND is_workspace_member(p.workspace_id)
  ));
CREATE POLICY "Permitted users can trigger scans" ON repository_scans FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM projects p WHERE p.id = project_id AND has_permission(p.workspace_id, 'code.trigger_scan')
  ));

-- Notifications
CREATE POLICY "Users see own notifications" ON notifications FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "System can create notifications" ON notifications FOR INSERT
  WITH CHECK (true);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE
  USING (user_id = auth.uid());

-- Notification Preferences
CREATE POLICY "Users see own preferences" ON notification_preferences FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Users can manage own preferences" ON notification_preferences FOR ALL
  USING (user_id = auth.uid());

-- AI Conversations
CREATE POLICY "Users see own conversations" ON ai_conversations FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Users can create conversations" ON ai_conversations FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can delete own conversations" ON ai_conversations FOR DELETE
  USING (user_id = auth.uid());

-- AI Messages
CREATE POLICY "Users see own conversation messages" ON ai_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM ai_conversations ac WHERE ac.id = conversation_id AND ac.user_id = auth.uid()
  ));
CREATE POLICY "Users can add messages" ON ai_messages FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM ai_conversations ac WHERE ac.id = conversation_id AND ac.user_id = auth.uid()
  ));

-- API Keys
CREATE POLICY "Members can view workspace keys" ON api_keys FOR SELECT
  USING (is_workspace_member(workspace_id));
CREATE POLICY "Managers can create keys" ON api_keys FOR INSERT
  WITH CHECK (has_permission(workspace_id, 'workspace.manage_integrations'));
CREATE POLICY "Managers can manage keys" ON api_keys FOR UPDATE
  USING (has_permission(workspace_id, 'workspace.manage_integrations'));
CREATE POLICY "Managers can delete keys" ON api_keys FOR DELETE
  USING (has_permission(workspace_id, 'workspace.manage_integrations'));

-- Reminders
CREATE POLICY "Users see own reminders" ON reminders FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "Users can create reminders" ON reminders FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own reminders" ON reminders FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "Users can delete own reminders" ON reminders FOR DELETE
  USING (user_id = auth.uid());

-- Webhooks
CREATE POLICY "Members can view webhooks" ON webhooks FOR SELECT
  USING (is_workspace_member(workspace_id));
CREATE POLICY "Managers can manage webhooks" ON webhooks FOR ALL
  USING (has_permission(workspace_id, 'workspace.manage_integrations'));

-- Saved Views
CREATE POLICY "Members can view saved views" ON saved_views FOR SELECT
  USING (is_workspace_member(workspace_id));
CREATE POLICY "Members can create views" ON saved_views FOR INSERT
  WITH CHECK (is_workspace_member(workspace_id));
CREATE POLICY "Creators can update own views" ON saved_views FOR UPDATE
  USING (created_by = (SELECT id FROM workspace_members WHERE user_id = auth.uid() AND workspace_id = saved_views.workspace_id));
CREATE POLICY "Creators can delete own views" ON saved_views FOR DELETE
  USING (created_by = (SELECT id FROM workspace_members WHERE user_id = auth.uid() AND workspace_id = saved_views.workspace_id));

-- ============================================================
-- FULL-TEXT SEARCH FUNCTION
-- ============================================================
CREATE OR REPLACE FUNCTION search_workspace(
  ws_id UUID,
  search_query TEXT,
  search_type TEXT DEFAULT NULL,
  result_limit INTEGER DEFAULT 10
)
RETURNS JSONB AS $$
DECLARE
  tsquery_val tsquery;
  task_results JSONB;
  bug_results JSONB;
  results JSONB := '{}';
BEGIN
  tsquery_val := websearch_to_tsquery('english', search_query);

  IF search_type IS NULL OR search_type = 'task' THEN
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO task_results
    FROM (
      SELECT id, identifier, title, status, ts_rank(fts, tsquery_val) as relevance
      FROM tasks
      WHERE workspace_id = ws_id AND fts @@ tsquery_val
      ORDER BY relevance DESC
      LIMIT result_limit
    ) t;
    results := results || jsonb_build_object('tasks', task_results);
  END IF;

  IF search_type IS NULL OR search_type = 'bug' THEN
    SELECT COALESCE(jsonb_agg(row_to_json(b)), '[]'::jsonb) INTO bug_results
    FROM (
      SELECT id, identifier, title, status, severity
      FROM bugs
      WHERE workspace_id = ws_id AND title ILIKE '%' || search_query || '%'
      ORDER BY created_at DESC
      LIMIT result_limit
    ) b;
    results := results || jsonb_build_object('bugs', bug_results);
  END IF;

  RETURN results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- ENABLE REALTIME
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE bugs;

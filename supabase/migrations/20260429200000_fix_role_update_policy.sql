-- Fix: Allow editing system roles except Owner
-- Previously: is_system = false blocked ALL system roles (Admin, Manager, Member, Viewer)
-- Now: Only the Owner role (position = 0) is protected from updates

DROP POLICY IF EXISTS "Role managers can update roles" ON roles;

CREATE POLICY "Role managers can update roles" ON roles FOR UPDATE
  USING (
    has_permission(workspace_id, 'workspace.manage_roles')
    AND position > 0  -- Only Owner (position 0) is immutable
  );

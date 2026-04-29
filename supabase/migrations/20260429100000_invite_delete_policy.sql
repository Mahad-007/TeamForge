-- Allow members with invite permission to delete/revoke invites
CREATE POLICY "Invite permission can delete invites" ON workspace_invites FOR DELETE
  USING (has_permission(workspace_id, 'workspace.invite'));

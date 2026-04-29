export type Permission =
  | "workspace.manage"
  | "workspace.invite"
  | "workspace.remove_members"
  | "workspace.manage_roles"
  | "workspace.manage_billing"
  | "workspace.manage_integrations"
  | "projects.create"
  | "projects.delete"
  | "projects.manage"
  | "projects.view_all"
  | "tasks.create"
  | "tasks.assign"
  | "tasks.delete"
  | "tasks.manage_all"
  | "tasks.change_status"
  | "bugs.create"
  | "bugs.assign"
  | "bugs.delete"
  | "bugs.manage_all"
  | "chat.create_channel"
  | "chat.manage_channels"
  | "chat.send_messages"
  | "chat.delete_any_message"
  | "wiki.create"
  | "wiki.edit_all"
  | "wiki.delete"
  | "wiki.manage"
  | "code.manage_repos"
  | "code.trigger_scan"
  | "code.view_reports"
  | "ai.use_assistant"
  | "ai.view_analytics";

export function checkPermission(
  rolePermissions: Record<string, boolean>,
  required: Permission
): boolean {
  return rolePermissions[required] === true;
}

export function checkAnyPermission(
  rolePermissions: Record<string, boolean>,
  required: Permission[]
): boolean {
  return required.some((p) => rolePermissions[p] === true);
}

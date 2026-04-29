import type { SupabaseClient } from "@supabase/supabase-js";

export type NotificationType =
  | "task_assigned"
  | "task_mentioned"
  | "task_status_changed"
  | "task_due_soon"
  | "task_overdue"
  | "bug_assigned"
  | "bug_reported"
  | "chat_mention"
  | "chat_dm"
  | "channel_invite"
  | "scan_completed"
  | "project_update"
  | "member_joined"
  | "reminder";

export async function createNotification(
  supabase: SupabaseClient,
  params: {
    workspace_id: string;
    user_id: string;
    type: NotificationType;
    title: string;
    body?: string;
    entity_type?: string;
    entity_id?: string;
  }
) {
  const { data, error } = await supabase
    .from("notifications")
    .insert(params)
    .select()
    .single();

  if (error) {
    console.error("Failed to create notification:", error);
    return null;
  }

  return data;
}

export async function createBulkNotifications(
  supabase: SupabaseClient,
  notifications: {
    workspace_id: string;
    user_id: string;
    type: NotificationType;
    title: string;
    body?: string;
    entity_type?: string;
    entity_id?: string;
  }[]
) {
  if (notifications.length === 0) return;

  const { error } = await supabase.from("notifications").insert(notifications);

  if (error) {
    console.error("Failed to create bulk notifications:", error);
  }
}

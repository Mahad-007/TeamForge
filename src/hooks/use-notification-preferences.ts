"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import type { Json } from "@/types/database";

export interface NotificationPreferencesData {
  channels: {
    task_assigned: { in_app: boolean; email: boolean; push: boolean };
    task_due_soon: { in_app: boolean; email: boolean; push: boolean };
    task_overdue: { in_app: boolean; email: boolean; push: boolean };
    task_status_changed: { in_app: boolean; email: boolean; push: boolean };
    bug_assigned: { in_app: boolean; email: boolean; push: boolean };
    bug_reported: { in_app: boolean; email: boolean; push: boolean };
    chat_mention: { in_app: boolean; email: boolean; push: boolean };
    chat_dm: { in_app: boolean; email: boolean; push: boolean };
    scan_completed: { in_app: boolean; email: boolean; push: boolean };
    member_joined: { in_app: boolean; email: boolean; push: boolean };
  };
  quiet_hours: {
    enabled: boolean;
    start_hour: number;
    end_hour: number;
  };
}

export const DEFAULT_PREFERENCES: NotificationPreferencesData = {
  channels: {
    task_assigned: { in_app: true, email: true, push: true },
    task_due_soon: { in_app: true, email: true, push: true },
    task_overdue: { in_app: true, email: true, push: true },
    task_status_changed: { in_app: true, email: true, push: true },
    bug_assigned: { in_app: true, email: true, push: true },
    bug_reported: { in_app: true, email: true, push: true },
    chat_mention: { in_app: true, email: true, push: true },
    chat_dm: { in_app: true, email: true, push: true },
    scan_completed: { in_app: true, email: true, push: true },
    member_joined: { in_app: true, email: true, push: true },
  },
  quiet_hours: {
    enabled: false,
    start_hour: 22,
    end_hour: 8,
  },
};

export function useNotificationPreferences(
  userId: string,
  workspaceId: string
) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["notification-preferences", userId, workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", userId)
        .eq("workspace_id", workspaceId)
        .single();

      if (error && error.code !== "PGRST116") throw error;

      // Return existing preferences or defaults
      if (data) {
        return {
          id: data.id,
          preferences:
            (data.preferences as unknown as NotificationPreferencesData) ??
            DEFAULT_PREFERENCES,
        };
      }

      return { id: null, preferences: DEFAULT_PREFERENCES };
    },
    enabled: !!userId && !!workspaceId,
  });
}

export function useUpdateNotificationPreferences(
  userId: string,
  workspaceId: string
) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      preferences,
    }: {
      id: string | null;
      preferences: NotificationPreferencesData;
    }) => {
      if (id) {
        // Update existing
        const { error } = await supabase
          .from("notification_preferences")
          .update({ preferences: preferences as unknown as Json })
          .eq("id", id);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase
          .from("notification_preferences")
          .insert({
            user_id: userId,
            workspace_id: workspaceId,
            preferences: preferences as unknown as Json,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notification-preferences", userId, workspaceId],
      });
      toast.success("Notification preferences saved");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

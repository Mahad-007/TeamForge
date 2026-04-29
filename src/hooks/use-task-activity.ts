"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useTaskActivity(taskId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["task-activity", taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_activity_log")
        .select(
          "*, actor:workspace_members!task_activity_log_actor_id_fkey(id, display_name, user_id)"
        )
        .eq("task_id", taskId)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      return data;
    },
    enabled: !!taskId,
  });
}

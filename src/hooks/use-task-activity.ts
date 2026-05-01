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

      // Resolve display names from profiles where actor.display_name is null
      const actorUserIds = data
        .map((e) => e.actor as { id: string; user_id: string; display_name: string | null } | null)
        .filter((a): a is { id: string; user_id: string; display_name: string | null } => !!a && !a.display_name)
        .map((a) => a.user_id);

      if (actorUserIds.length > 0) {
        const uniqueIds = [...new Set(actorUserIds)];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", uniqueIds);
        const profileMap = new Map(profiles?.map((p) => [p.id, p.display_name]) ?? []);

        return data.map((e) => {
          const actor = e.actor as { id: string; user_id: string; display_name: string | null } | null;
          if (actor && !actor.display_name) {
            return {
              ...e,
              actor: { ...actor, display_name: profileMap.get(actor.user_id) ?? null },
            };
          }
          return e;
        });
      }

      return data;
    },
    enabled: !!taskId,
  });
}

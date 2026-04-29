"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";

interface ActivityFeedWidgetProps {
  workspaceId: string;
}

export function ActivityFeedWidget({ workspaceId }: ActivityFeedWidgetProps) {
  const supabase = createClient();

  const { data: activities, isLoading } = useQuery({
    queryKey: ["workspace-activity", workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_activity_log")
        .select(
          "id, action, old_value, new_value, created_at, actor:workspace_members!task_activity_log_actor_id_fkey(display_name), task:tasks(identifier, title)"
        )
        .order("created_at", { ascending: false })
        .limit(15);

      if (error) throw error;
      return data;
    },
  });

  function formatAction(activity: {
    action: string;
    old_value: string | null;
    new_value: string | null;
    actor: unknown;
    task: unknown;
  }) {
    const actorName =
      (activity.actor as { display_name: string | null })?.display_name ??
      "Someone";
    const taskInfo = activity.task as {
      identifier: string;
      title: string;
    } | null;
    const taskLabel = taskInfo
      ? `${taskInfo.identifier} ${taskInfo.title}`
      : "a task";

    switch (activity.action) {
      case "status_changed":
        return `${actorName} changed ${taskLabel} status to ${activity.new_value}`;
      case "assigned":
        return `${actorName} assigned ${taskLabel} to ${activity.new_value}`;
      case "priority_changed":
        return `${actorName} changed ${taskLabel} priority to ${activity.new_value}`;
      case "created":
        return `${actorName} created ${taskLabel}`;
      case "comment_added":
        return `${actorName} commented on ${taskLabel}`;
      default:
        return `${actorName} updated ${taskLabel}`;
    }
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-8" />
            ))}
          </div>
        ) : activities && activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="flex items-start gap-2 text-sm">
                <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-muted-foreground">
                    {formatAction(activity)}
                  </p>
                  <p className="text-[10px] text-muted-foreground/60">
                    {formatDistanceToNow(new Date(activity.created_at!), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No activity yet. Activity will appear as your team works.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useTaskActivity } from "@/hooks/use-task-activity";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Activity,
  ArrowRight,
  UserPlus,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  Pencil,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface TaskActivityProps {
  taskId: string;
}

const ACTION_ICONS: Record<string, React.ReactNode> = {
  status_changed: <ArrowRight className="h-3.5 w-3.5 text-blue-500" />,
  assigned: <UserPlus className="h-3.5 w-3.5 text-green-500" />,
  priority_changed: <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />,
  completed: <CheckCircle className="h-3.5 w-3.5 text-green-500" />,
  comment_added: <MessageSquare className="h-3.5 w-3.5 text-muted-foreground" />,
  description_edited: <Pencil className="h-3.5 w-3.5 text-muted-foreground" />,
  created: <Activity className="h-3.5 w-3.5 text-primary" />,
};

function formatAction(action: string, oldValue: string | null, newValue: string | null): string {
  switch (action) {
    case "status_changed":
      return `changed status from ${oldValue ?? "none"} to ${newValue ?? "unknown"}`;
    case "assigned":
      return newValue ? `assigned to ${newValue}` : "removed assignee";
    case "priority_changed":
      return `changed priority from ${oldValue ?? "none"} to ${newValue ?? "unknown"}`;
    case "description_edited":
      return "updated the description";
    case "comment_added":
      return "added a comment";
    case "created":
      return "created this task";
    default:
      return action.replace(/_/g, " ");
  }
}

export function TaskActivity({ taskId }: TaskActivityProps) {
  const { data: activities, isLoading } = useTaskActivity(taskId);

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-full" />
      </div>
    );
  }

  if (!activities?.length) {
    return (
      <p className="text-sm text-muted-foreground">No activity yet.</p>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="flex items-center gap-2 text-sm font-medium">
        <Activity className="h-4 w-4" />
        Activity
      </h4>

      <div className="space-y-3">
        {activities.map((entry) => {
          const actor = entry.actor as { id: string; display_name: string | null } | null;
          const actorName = actor?.display_name ?? "Someone";

          return (
            <div key={entry.id} className="flex items-start gap-3 text-sm">
              <div className="mt-0.5 shrink-0">
                {ACTION_ICONS[entry.action] ?? <Activity className="h-3.5 w-3.5 text-muted-foreground" />}
              </div>
              <div className="flex-1">
                <span className="font-medium">{actorName}</span>{" "}
                <span className="text-muted-foreground">
                  {formatAction(entry.action, entry.old_value, entry.new_value)}
                </span>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(entry.created_at!), { addSuffix: true })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

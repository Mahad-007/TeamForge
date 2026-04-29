"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface MyTasksWidgetProps {
  memberId: string;
  workspaceId: string;
}

export function MyTasksWidget({ memberId, workspaceId }: MyTasksWidgetProps) {
  const supabase = createClient();

  const { data: tasks, isLoading } = useQuery({
    queryKey: ["my-tasks", memberId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, identifier, title, status, priority, due_date, project:projects(name, slug)")
        .eq("assignee_id", memberId)
        .is("completed_at", null)
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  const overdueTasks = tasks?.filter(
    (t) => t.due_date && new Date(t.due_date) < new Date()
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">My Tasks</CardTitle>
          <Badge variant="secondary">{tasks?.length ?? 0}</Badge>
        </div>
        {overdueTasks && overdueTasks.length > 0 && (
          <p className="text-xs text-destructive font-medium">
            {overdueTasks.length} overdue
          </p>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>
        ) : tasks && tasks.length > 0 ? (
          <div className="space-y-2">
            {tasks.map((task) => {
              const isOverdue =
                task.due_date && new Date(task.due_date) < new Date();
              const project = task.project as unknown as {
                name: string;
                slug: string;
              };
              return (
                <div
                  key={task.id}
                  className={cn(
                    "flex items-center gap-3 rounded-md border p-2.5 text-sm",
                    isOverdue && "border-destructive/30 bg-destructive/5"
                  )}
                >
                  <span
                    className={cn(
                      "h-2 w-2 shrink-0 rounded-full",
                      task.priority === "urgent" && "bg-red-500",
                      task.priority === "high" && "bg-orange-500",
                      task.priority === "medium" && "bg-amber-500",
                      task.priority === "low" && "bg-blue-500",
                      task.priority === "none" && "bg-gray-400"
                    )}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{task.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {task.identifier} &middot; {project?.name}
                    </p>
                  </div>
                  {task.due_date && (
                    <span
                      className={cn(
                        "flex shrink-0 items-center gap-1 text-xs",
                        isOverdue
                          ? "font-medium text-destructive"
                          : "text-muted-foreground"
                      )}
                    >
                      <Calendar className="h-3 w-3" />
                      {new Date(task.due_date).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-6 text-center text-muted-foreground">
            <CheckCircle2 className="h-8 w-8" />
            <p className="text-sm">No tasks assigned to you.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

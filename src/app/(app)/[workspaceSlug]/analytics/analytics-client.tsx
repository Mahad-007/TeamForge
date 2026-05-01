"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { BarChart3, CheckCircle2, Bug, FolderKanban } from "lucide-react";
import { TasksPerMemberChart } from "@/components/analytics/tasks-per-member-chart";
import { ActivityHeatmap } from "@/components/analytics/activity-heatmap";
import { BugTrendChart } from "@/components/analytics/bug-trend-chart";

interface AnalyticsClientProps {
  workspaceId: string;
}

export function AnalyticsClient({ workspaceId }: AnalyticsClientProps) {
  const supabase = createClient();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["workspace-analytics", workspaceId],
    queryFn: async () => {
      const [projects, tasks, bugs, members] =
        await Promise.all([
          supabase.from("projects").select("id, name, slug, status, priority, settings", { count: "exact" }).eq("workspace_id", workspaceId).neq("status", "archived"),
          supabase.from("tasks").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId),
          supabase.from("bugs").select("*", { count: "exact", head: true }).eq("workspace_id", workspaceId).in("status", ["open", "confirmed", "in_progress"]),
          supabase.from("workspace_members").select("id, display_name", { count: "exact" }).eq("workspace_id", workspaceId).eq("status", "active"),
        ]);

      // Fetch all tasks to compute per-project completion in JS
      const defaultStatuses = ["Backlog", "Todo", "In Progress", "Review", "Done"];
      const { data: allTaskRows } = await supabase
        .from("tasks")
        .select("project_id, status")
        .eq("workspace_id", workspaceId);

      const projectStats = [];
      let totalCompleted = 0;
      for (const proj of projects.data ?? []) {
        const statuses = (proj.settings as Record<string, unknown>)?.statuses as string[] ?? defaultStatuses;
        const doneStatus = statuses[statuses.length - 1].toLowerCase();

        const projectTasks = (allTaskRows ?? []).filter((t) => t.project_id === proj.id);
        const total = projectTasks.length;
        const done = projectTasks.filter((t) => t.status.toLowerCase() === doneStatus).length;
        totalCompleted += done;
        projectStats.push({
          ...proj,
          totalTasks: total,
          completedTasks: done,
          completion: total > 0 ? Math.round((done / total) * 100) : 0,
        });
      }

      return {
        totalProjects: projects.count ?? 0,
        totalTasks: tasks.count ?? 0,
        completedTasks: totalCompleted,
        openBugs: bugs.count ?? 0,
        totalMembers: members.count ?? 0,
        projects: projectStats,
        overallCompletion:
          (tasks.count ?? 0) > 0
            ? Math.round((totalCompleted / (tasks.count ?? 1)) * 100)
            : 0,
      };
    },
  });

  // Tasks per member query
  const { data: tasksPerMember } = useQuery({
    queryKey: ["analytics-tasks-per-member", workspaceId],
    queryFn: async () => {
      const { data: allTasks } = await supabase
        .from("tasks")
        .select("assignee_id, status, project:projects!tasks_project_id_fkey(settings), assignee:workspace_members!tasks_assignee_id_fkey(display_name)")
        .eq("workspace_id", workspaceId);

      if (!allTasks || allTasks.length === 0) return [];

      const defaultStatuses = ["Backlog", "Todo", "In Progress", "Review", "Done"];
      const memberMap = new Map<
        string,
        { name: string; completed: number; open: number }
      >();

      for (const task of allTasks) {
        const memberId = task.assignee_id as string | null;
        const name = memberId
          ? ((task.assignee as { display_name: string | null } | null)
              ?.display_name ?? "Unknown")
          : "Unassigned";
        const statuses = (task.project as Record<string, unknown>)?.settings
          ? ((task.project as Record<string, unknown>).settings as Record<string, unknown>)?.statuses as string[] ?? defaultStatuses
          : defaultStatuses;
        const doneStatus = statuses[statuses.length - 1];

        const key = memberId ?? "__unassigned__";
        if (!memberMap.has(key)) {
          memberMap.set(key, { name, completed: 0, open: 0 });
        }

        const entry = memberMap.get(key)!;
        if (task.status.toLowerCase() === doneStatus.toLowerCase()) {
          entry.completed += 1;
        } else {
          entry.open += 1;
        }
      }

      return Array.from(memberMap.values()).sort(
        (a, b) => b.completed + b.open - (a.completed + a.open)
      );
    },
  });

  // Activity heatmap query
  const { data: activityHeatmap } = useQuery({
    queryKey: ["analytics-activity-heatmap", workspaceId],
    queryFn: async () => {
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const { data: activities } = await supabase
        .from("task_activity_log")
        .select("created_at, task_id!inner(workspace_id)")
        .gte("created_at", oneYearAgo.toISOString())
        .eq("task_id.workspace_id" as any, workspaceId);

      const heatmap: Record<string, number> = {};

      if (activities) {
        for (const activity of activities) {
          if (!activity.created_at) continue;
          const date = new Date(activity.created_at).toISOString().split("T")[0];
          heatmap[date] = (heatmap[date] ?? 0) + 1;
        }
      }

      return heatmap;
    },
  });

  // Bug trends query
  const { data: bugTrends } = useQuery({
    queryKey: ["analytics-bug-trends", workspaceId],
    queryFn: async () => {
      const { data: allBugs } = await supabase
        .from("bugs")
        .select("created_at, resolved_at, status")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: true });

      if (!allBugs || allBugs.length === 0) return [];

      // Build a day-by-day trend over the last 30 days
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const trends: { date: string; open: number; resolved: number }[] = [];

      for (let d = new Date(thirtyDaysAgo); d <= today; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split("T")[0];
        const endOfDay = new Date(dateStr + "T23:59:59.999Z");

        let openCount = 0;
        let resolvedCount = 0;

        for (const bug of allBugs) {
          if (!bug.created_at) continue;
          const created = new Date(bug.created_at);
          if (created <= endOfDay) {
            if (
              bug.resolved_at &&
              new Date(bug.resolved_at) <= endOfDay
            ) {
              resolvedCount += 1;
            } else {
              openCount += 1;
            }
          }
        }

        trends.push({ date: dateStr, open: openCount, resolved: resolvedCount });
      }

      return trends;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24" />
          ))}
        </div>
        <Skeleton className="h-64" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Workspace Analytics</h1>
        <p className="text-sm text-muted-foreground">
          Overview of all projects and team performance.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <FolderKanban className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats?.totalProjects}</p>
              <p className="text-xs text-muted-foreground">Active Projects</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <CheckCircle2 className="h-8 w-8 text-success" />
            <div>
              <p className="text-2xl font-bold">{stats?.overallCompletion}%</p>
              <p className="text-xs text-muted-foreground">Tasks Completed</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <Bug className="h-8 w-8 text-destructive" />
            <div>
              <p className="text-2xl font-bold">{stats?.openBugs}</p>
              <p className="text-xs text-muted-foreground">Open Bugs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-6">
            <BarChart3 className="h-8 w-8 text-warning" />
            <div>
              <p className="text-2xl font-bold">{stats?.totalMembers}</p>
              <p className="text-xs text-muted-foreground">Team Members</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Project breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Project Progress</CardTitle>
        </CardHeader>
        <CardContent>
          {stats?.projects && stats.projects.length > 0 ? (
            <div className="space-y-4">
              {stats.projects.map((proj) => (
                <div key={proj.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{proj.name}</span>
                      <Badge variant="secondary" className="text-[10px]">
                        {proj.status}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {proj.completedTasks}/{proj.totalTasks} tasks
                    </span>
                  </div>
                  <Progress value={proj.completion} className="h-2" />
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-sm text-muted-foreground py-8">
              No projects yet.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Enhanced analytics charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <TasksPerMemberChart data={tasksPerMember ?? []} />
        <BugTrendChart data={bugTrends ?? []} />
      </div>

      <ActivityHeatmap data={activityHeatmap ?? {}} />
    </div>
  );
}

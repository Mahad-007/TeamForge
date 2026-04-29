"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { MyTasksWidget } from "@/components/dashboard/my-tasks-widget";
import { ActivityFeedWidget } from "@/components/dashboard/activity-feed-widget";
import { FolderKanban, CheckCircle2, Bug, Users } from "lucide-react";

interface DashboardClientProps {
  displayName: string;
  workspaceId: string;
  memberId: string;
}

export function DashboardClient({
  displayName,
  workspaceId,
  memberId,
}: DashboardClientProps) {
  const supabase = createClient();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["dashboard-stats", workspaceId],
    queryFn: async () => {
      const [projects, tasks, bugs, members] = await Promise.all([
        supabase
          .from("projects")
          .select("*", { count: "exact", head: true })
          .eq("workspace_id", workspaceId),
        supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("workspace_id", workspaceId),
        supabase
          .from("bugs")
          .select("*", { count: "exact", head: true })
          .eq("workspace_id", workspaceId),
        supabase
          .from("workspace_members")
          .select("*", { count: "exact", head: true })
          .eq("workspace_id", workspaceId)
          .eq("status", "active"),
      ]);

      return {
        projects: projects.count ?? 0,
        tasks: tasks.count ?? 0,
        bugs: bugs.count ?? 0,
        members: members.count ?? 0,
      };
    },
  });

  const greeting = getGreeting();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          {greeting}, {displayName}
        </h1>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening in your workspace.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Projects"
          value={stats?.projects}
          icon={FolderKanban}
          loading={isLoading}
        />
        <StatCard
          title="Tasks"
          value={stats?.tasks}
          icon={CheckCircle2}
          loading={isLoading}
        />
        <StatCard
          title="Bugs"
          value={stats?.bugs}
          icon={Bug}
          loading={isLoading}
        />
        <StatCard
          title="Members"
          value={stats?.members}
          icon={Users}
          loading={isLoading}
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <MyTasksWidget memberId={memberId} workspaceId={workspaceId} />
        <ActivityFeedWidget workspaceId={workspaceId} />
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  loading,
}: {
  title: string;
  value?: number;
  icon: React.ElementType;
  loading: boolean;
}) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
          <Icon className="h-5 w-5 text-primary" />
        </div>
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          {loading ? (
            <Skeleton className="mt-1 h-6 w-12" />
          ) : (
            <p className="text-2xl font-bold">{value ?? 0}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

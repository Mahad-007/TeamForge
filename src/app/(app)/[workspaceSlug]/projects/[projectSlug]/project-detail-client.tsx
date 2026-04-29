"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Bug,
  KanbanSquare,
  List,
  Settings,
} from "lucide-react";

interface ProjectDetailClientProps {
  project: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    status: string;
    priority: string | null;
    start_date: string | null;
    target_date: string | null;
    settings: unknown;
  };
  workspaceSlug: string;
  workspaceId: string;
  currentMemberId: string;
}

export function ProjectDetailClient({
  project,
  workspaceSlug,
  workspaceId,
  currentMemberId,
}: ProjectDetailClientProps) {
  const supabase = createClient();
  const base = `/${workspaceSlug}/projects/${project.slug}`;

  const { data: stats } = useQuery({
    queryKey: ["project-stats", project.id],
    queryFn: async () => {
      const [totalTasks, completedTasks, openBugs] = await Promise.all([
        supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("project_id", project.id),
        supabase
          .from("tasks")
          .select("*", { count: "exact", head: true })
          .eq("project_id", project.id)
          .not("completed_at", "is", null),
        supabase
          .from("bugs")
          .select("*", { count: "exact", head: true })
          .eq("project_id", project.id)
          .in("status", ["open", "confirmed", "in_progress"]),
      ]);

      return {
        totalTasks: totalTasks.count ?? 0,
        completedTasks: completedTasks.count ?? 0,
        openBugs: openBugs.count ?? 0,
      };
    },
  });

  const completion =
    stats && stats.totalTasks > 0
      ? Math.round((stats.completedTasks / stats.totalTasks) * 100)
      : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Link href={`/${workspaceSlug}/projects`}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            {project.description && (
              <p className="mt-1 text-sm text-muted-foreground">
                {project.description}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{project.status}</Badge>
          {project.priority && (
            <Badge variant="outline">{project.priority}</Badge>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <CheckCircle2 className="h-8 w-8 text-success" />
            <div>
              <p className="text-2xl font-bold">{completion}%</p>
              <p className="text-xs text-muted-foreground">
                {stats?.completedTasks ?? 0}/{stats?.totalTasks ?? 0} tasks
                completed
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Bug className="h-8 w-8 text-destructive" />
            <div>
              <p className="text-2xl font-bold">{stats?.openBugs ?? 0}</p>
              <p className="text-xs text-muted-foreground">Open bugs</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <Calendar className="h-8 w-8 text-primary" />
            <div>
              <p className="text-2xl font-bold">
                {project.target_date
                  ? new Date(project.target_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : "No date"}
              </p>
              <p className="text-xs text-muted-foreground">Target date</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Navigation */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Link href={`${base}/board`}>
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <KanbanSquare className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Board</p>
                <p className="text-xs text-muted-foreground">Kanban view</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href={`${base}/list`}>
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <List className="h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">List</p>
                <p className="text-xs text-muted-foreground">Table view</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href={`${base}/bugs`}>
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <Bug className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium">Bugs</p>
                <p className="text-xs text-muted-foreground">Bug tracker</p>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href={`${base}/settings`}>
          <Card className="cursor-pointer transition-shadow hover:shadow-md">
            <CardContent className="flex items-center gap-3 p-4">
              <Settings className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Settings</p>
                <p className="text-xs text-muted-foreground">
                  Configure project
                </p>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}

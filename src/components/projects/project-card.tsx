"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar, FolderKanban } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const statusColors: Record<string, string> = {
  planning: "bg-muted text-muted-foreground",
  active: "bg-success/10 text-success",
  paused: "bg-warning/10 text-warning",
  completed: "bg-primary/10 text-primary",
  archived: "bg-muted text-muted-foreground",
};

const priorityColors: Record<string, string> = {
  low: "bg-blue-500/10 text-blue-600",
  medium: "bg-amber-500/10 text-amber-600",
  high: "bg-orange-500/10 text-orange-600",
  critical: "bg-red-500/10 text-red-600",
};

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    status: string;
    priority: string | null;
    target_date: string | null;
    created_at: string | null;
    lead?: {
      display_name: string | null;
    } | null;
  };
  workspaceSlug: string;
}

export function ProjectCard({ project, workspaceSlug }: ProjectCardProps) {
  const leadName = project.lead?.display_name;

  return (
    <Link href={`/${workspaceSlug}/projects/${project.slug}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="p-5">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <FolderKanban className="h-4 w-4 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{project.name}</h3>
                {project.description && (
                  <p className="mt-0.5 line-clamp-1 text-sm text-muted-foreground">
                    {project.description}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className={statusColors[project.status]}>
              {project.status}
            </Badge>
            {project.priority && (
              <Badge
                variant="secondary"
                className={priorityColors[project.priority]}
              >
                {project.priority}
              </Badge>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              {project.target_date && (
                <>
                  <Calendar className="h-3 w-3" />
                  <span>
                    {new Date(project.target_date).toLocaleDateString()}
                  </span>
                </>
              )}
            </div>
            {leadName && (
              <div className="flex items-center gap-1.5">
                <Avatar className="h-5 w-5">
                  <AvatarFallback className="text-[10px]">
                    {leadName[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span>{leadName}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

"use client";

import Link from "next/link";
import { useTasks } from "@/hooks/use-tasks";
import { TimelineView } from "@/components/tasks/timeline-view";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

interface TimelinePageClientProps {
  projectId: string;
  projectName: string;
  projectSlug: string;
  workspaceSlug: string;
}

export function TimelinePageClient({
  projectId,
  projectName,
  projectSlug,
  workspaceSlug,
}: TimelinePageClientProps) {
  const { data: tasks, isLoading } = useTasks(projectId);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href={`/${workspaceSlug}/projects/${projectSlug}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">{projectName}</h1>
          <p className="text-sm text-muted-foreground">Timeline view</p>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-96" />
      ) : (
        <TimelineView tasks={(tasks as any[]) ?? []} />
      )}
    </div>
  );
}

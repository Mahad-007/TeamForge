"use client";

import Link from "next/link";
import { useTasks } from "@/hooks/use-tasks";
import { CalendarView } from "@/components/tasks/calendar-view";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";

interface CalendarPageClientProps {
  projectId: string;
  projectName: string;
  projectSlug: string;
  workspaceSlug: string;
}

export function CalendarPageClient({
  projectId,
  projectName,
  projectSlug,
  workspaceSlug,
}: CalendarPageClientProps) {
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
          <p className="text-sm text-muted-foreground">Calendar view</p>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-[500px]" />
      ) : (
        <CalendarView tasks={(tasks as any[]) ?? []} />
      )}
    </div>
  );
}

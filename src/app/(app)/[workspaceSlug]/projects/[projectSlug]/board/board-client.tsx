"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useTasks } from "@/hooks/use-tasks";
import { useWorkspaceMembersWithProfiles } from "@/hooks/use-members";
import { TaskBoard } from "@/components/tasks/task-board";
import { TaskDetailPanel } from "@/components/tasks/task-detail-panel";
import { FilterBar } from "@/components/tasks/filter-bar";
import { SavedViewsDropdown } from "@/components/tasks/saved-views-dropdown";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, List } from "lucide-react";
import type { TaskCardData } from "@/components/tasks/task-card";

interface BoardClientProps {
  projectId: string;
  projectName: string;
  projectSlug: string;
  workspaceSlug: string;
  workspaceId: string;
  currentMemberId: string;
  statuses: string[];
}

export function BoardClient({
  projectId,
  projectName,
  projectSlug,
  workspaceSlug,
  workspaceId,
  currentMemberId,
  statuses,
}: BoardClientProps) {
  const [filters, setFilters] = useState<{
    status?: string;
    assignee_id?: string;
    priority?: string;
  }>({});
  const { data: tasks, isLoading } = useTasks(projectId, filters);
  const { data: membersData } = useWorkspaceMembersWithProfiles(workspaceId);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  const members = useMemo(
    () =>
      (membersData ?? []).map((m) => ({
        id: m.id,
        display_name: m.display_name,
      })),
    [membersData]
  );

  const base = `/${workspaceSlug}/projects/${projectSlug}`;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href={base}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold">{projectName}</h1>
            <p className="text-sm text-muted-foreground">Board view</p>
          </div>
        </div>
        <Link href={`${base}/list`}>
          <Button variant="outline" size="sm">
            <List className="mr-2 h-4 w-4" />
            List view
          </Button>
        </Link>
      </div>

      {/* Filter toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <FilterBar
          statuses={statuses}
          members={members}
          filters={filters}
          onFilterChange={setFilters}
        />
        <SavedViewsDropdown
          projectId={projectId}
          workspaceId={workspaceId}
          currentMemberId={currentMemberId}
          currentFilters={filters}
          onApplyView={setFilters}
        />
      </div>

      {isLoading ? (
        <div className="flex gap-4">
          {statuses.map((s) => (
            <Skeleton key={s} className="h-96 w-72 shrink-0 rounded-lg" />
          ))}
        </div>
      ) : (
        <TaskBoard
          tasks={(tasks as TaskCardData[]) ?? []}
          statuses={statuses}
          projectId={projectId}
          workspaceId={workspaceId}
          currentMemberId={currentMemberId}
          onTaskClick={(task) => setSelectedTaskId(task.id)}
        />
      )}

      <TaskDetailPanel
        taskId={selectedTaskId}
        projectId={projectId}
        statuses={statuses}
        workspaceId={workspaceId}
        currentMemberId={currentMemberId}
        onClose={() => setSelectedTaskId(null)}
      />
    </div>
  );
}

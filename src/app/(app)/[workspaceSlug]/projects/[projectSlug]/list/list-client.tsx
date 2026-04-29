"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import {
  useTasks,
  useUpdateTask,
  useBulkUpdateTasks,
  useBulkDeleteTasks,
} from "@/hooks/use-tasks";
import { useWorkspaceMembersWithProfiles } from "@/hooks/use-members";
import { TaskDetailPanel } from "@/components/tasks/task-detail-panel";
import { TaskForm } from "@/components/tasks/task-form";
import { FilterBar } from "@/components/tasks/filter-bar";
import { SavedViewsDropdown } from "@/components/tasks/saved-views-dropdown";
import { BulkActionToolbar } from "@/components/tasks/bulk-action-toolbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, Calendar, ChevronDown, Download, KanbanSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { exportTasksCSV } from "@/lib/export/csv";
import { exportTasksPDF } from "@/lib/export/pdf";

const priorityIcon: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-amber-500",
  low: "bg-blue-500",
  none: "bg-gray-400",
};

interface ListClientProps {
  projectId: string;
  projectName: string;
  projectSlug: string;
  workspaceSlug: string;
  workspaceId: string;
  currentMemberId: string;
  statuses: string[];
}

export function ListClient({
  projectId,
  projectName,
  projectSlug,
  workspaceSlug,
  workspaceId,
  currentMemberId,
  statuses,
}: ListClientProps) {
  const [filters, setFilters] = useState<{
    status?: string;
    assignee_id?: string;
    priority?: string;
  }>({});
  const { data: tasks, isLoading } = useTasks(projectId, filters);
  const updateTask = useUpdateTask();
  const bulkUpdate = useBulkUpdateTasks(projectId);
  const bulkDelete = useBulkDeleteTasks(projectId);
  const { data: membersData } = useWorkspaceMembersWithProfiles(workspaceId);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(
    new Set()
  );

  const members = useMemo(
    () =>
      (membersData ?? []).map((m) => ({
        id: m.id,
        display_name: m.display_name,
      })),
    [membersData]
  );

  const base = `/${workspaceSlug}/projects/${projectSlug}`;

  const allTaskIds = useMemo(
    () => (tasks ?? []).map((t) => t.id),
    [tasks]
  );

  const allSelected =
    allTaskIds.length > 0 && allTaskIds.every((id) => selectedTaskIds.has(id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedTaskIds(new Set());
    } else {
      setSelectedTaskIds(new Set(allTaskIds));
    }
  };

  const toggleTask = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleBulkStatusChange = (status: string) => {
    bulkUpdate.mutate(
      { ids: Array.from(selectedTaskIds), updates: { status } },
      {
        onSuccess: () => {
          toast.success(`Updated ${selectedTaskIds.size} tasks`);
          setSelectedTaskIds(new Set());
        },
        onError: () => toast.error("Failed to update tasks"),
      }
    );
  };

  const handleBulkAssign = (assigneeId: string | null) => {
    bulkUpdate.mutate(
      {
        ids: Array.from(selectedTaskIds),
        updates: { assignee_id: assigneeId },
      },
      {
        onSuccess: () => {
          toast.success(`Updated ${selectedTaskIds.size} tasks`);
          setSelectedTaskIds(new Set());
        },
        onError: () => toast.error("Failed to update tasks"),
      }
    );
  };

  const handleBulkDelete = () => {
    bulkDelete.mutate(Array.from(selectedTaskIds), {
      onSuccess: () => {
        toast.success(`Deleted ${selectedTaskIds.size} tasks`);
        setSelectedTaskIds(new Set());
      },
      onError: () => toast.error("Failed to delete tasks"),
    });
  };

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
            <p className="text-sm text-muted-foreground">List view</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger
              className="inline-flex items-center justify-center gap-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
            >
              <Download className="h-4 w-4" />
              Export
              <ChevronDown className="h-3 w-3 opacity-60" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  if (!tasks) return;
                  const csv = exportTasksCSV(
                    tasks.map((t) => ({
                      identifier: t.identifier,
                      title: t.title,
                      status: t.status,
                      priority: t.priority,
                      type: t.type,
                      due_date: t.due_date,
                      created_at: t.created_at,
                      completed_at: t.completed_at,
                      labels: t.labels,
                      assignee_name:
                        (t.assignee as { display_name: string | null } | null)
                          ?.display_name ?? undefined,
                    }))
                  );
                  const blob = new Blob([csv], { type: "text/csv" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${projectName}-tasks.csv`;
                  a.click();
                  URL.revokeObjectURL(url);
                }}
              >
                Export CSV
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  if (!tasks) return;
                  exportTasksPDF(
                    tasks.map((t) => ({
                      identifier: t.identifier,
                      title: t.title,
                      status: t.status,
                      priority: t.priority,
                      due_date: t.due_date,
                      assignee_name:
                        (t.assignee as { display_name: string | null } | null)
                          ?.display_name ?? undefined,
                    })),
                    projectName
                  );
                }}
              >
                Export PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Link href={`${base}/board`}>
            <Button variant="outline" size="sm">
              <KanbanSquare className="mr-2 h-4 w-4" />
              Board view
            </Button>
          </Link>
        </div>
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
        <div className="space-y-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-12 rounded-md" />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border">
          {/* Header */}
          <div className="grid grid-cols-[40px_1fr_120px_120px_100px_100px] gap-2 border-b bg-muted/50 px-4 py-2 text-xs font-medium text-muted-foreground">
            <span className="flex items-center justify-center">
              <Checkbox
                checked={allSelected}
                onCheckedChange={toggleSelectAll}
              />
            </span>
            <span>Task</span>
            <span>Status</span>
            <span>Priority</span>
            <span>Assignee</span>
            <span>Due date</span>
          </div>

          {/* Rows */}
          {tasks && tasks.length > 0 ? (
            tasks.map((task) => {
              const assigneeName = (task.assignee as { display_name: string | null } | null)?.display_name;
              const isOverdue =
                task.due_date &&
                new Date(task.due_date) < new Date() &&
                !task.completed_at;
              const isSelected = selectedTaskIds.has(task.id);

              return (
                <div
                  key={task.id}
                  className={cn(
                    "grid cursor-pointer grid-cols-[40px_1fr_120px_120px_100px_100px] items-center gap-2 border-b px-4 py-2.5 text-sm transition-colors hover:bg-muted/30 last:border-0",
                    isSelected && "bg-muted/40"
                  )}
                >
                  <span
                    className="flex items-center justify-center"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => toggleTask(task.id)}
                    />
                  </span>
                  <Link
                    href={`${base}/tasks/${task.identifier}`}
                    className="flex items-center gap-2 min-w-0"
                    onClick={() => setSelectedTaskId(task.id)}
                  >
                    <span
                      className={cn(
                        "h-2 w-2 shrink-0 rounded-full",
                        priorityIcon[task.priority]
                      )}
                    />
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {task.identifier}
                    </span>
                    <span className="truncate font-medium">{task.title}</span>
                  </Link>
                  <div onClick={() => setSelectedTaskId(task.id)}>
                    <Badge variant="secondary" className="text-xs">
                      {task.status}
                    </Badge>
                  </div>
                  <div onClick={() => setSelectedTaskId(task.id)}>
                    <Badge variant="outline" className="text-xs capitalize">
                      {task.priority}
                    </Badge>
                  </div>
                  <div onClick={() => setSelectedTaskId(task.id)}>
                    {assigneeName ? (
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[10px]">
                          {assigneeName[0]?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <span className="text-xs text-muted-foreground">--</span>
                    )}
                  </div>
                  <div onClick={() => setSelectedTaskId(task.id)}>
                    {task.due_date ? (
                      <span
                        className={cn(
                          "flex items-center gap-1 text-xs",
                          isOverdue
                            ? "text-destructive font-medium"
                            : "text-muted-foreground"
                        )}
                      >
                        <Calendar className="h-3 w-3" />
                        {new Date(task.due_date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">--</span>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No tasks yet. Add your first task below.
            </div>
          )}
        </div>
      )}

      <TaskForm
        projectId={projectId}
        workspaceId={workspaceId}
        currentMemberId={currentMemberId}
        defaultStatus={statuses[0]}
        variant="inline"
      />

      <TaskDetailPanel
        taskId={selectedTaskId}
        projectId={projectId}
        statuses={statuses}
        workspaceId={workspaceId}
        currentMemberId={currentMemberId}
        onClose={() => setSelectedTaskId(null)}
      />

      <BulkActionToolbar
        selectedCount={selectedTaskIds.size}
        statuses={statuses}
        members={members}
        onBulkStatusChange={handleBulkStatusChange}
        onBulkAssign={handleBulkAssign}
        onBulkDelete={handleBulkDelete}
        onClearSelection={() => setSelectedTaskIds(new Set())}
      />
    </div>
  );
}

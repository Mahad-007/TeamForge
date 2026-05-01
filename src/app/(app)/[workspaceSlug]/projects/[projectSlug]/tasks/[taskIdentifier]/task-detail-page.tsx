"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useUpdateTask, useDeleteTask } from "@/hooks/use-tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { DatePicker } from "@/components/ui/date-picker";
import { TaskComments } from "@/components/tasks/task-comments";
import { TaskActivity } from "@/components/tasks/task-activity";
import { SubtaskList } from "@/components/tasks/subtask-list";
import { TASK_PRIORITIES, TASK_TYPES } from "@/types/enums";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Trash2, X as XIcon } from "lucide-react";
import { toast } from "sonner";

interface TaskDetailPageProps {
  task: {
    id: string;
    identifier: string;
    title: string;
    description: string | null;
    status: string;
    priority: string;
    type: string;
    assignee_id: string | null;
    reporter_id: string;
    due_date: string | null;
    labels: string[] | null;
    created_at: string | null;
    completed_at: string | null;
    project_id: string;
    assignee: { id: string; display_name: string | null } | null;
    reporter: { id: string; display_name: string | null } | null;
  };
  projectId: string;
  projectName: string;
  projectSlug: string;
  workspaceId: string;
  workspaceSlug: string;
  currentMemberId: string;
  statuses: string[];
}

export function TaskDetailPage({
  task: initialTask,
  projectId,
  projectName,
  projectSlug,
  workspaceId,
  workspaceSlug,
  currentMemberId,
  statuses,
}: TaskDetailPageProps) {
  const router = useRouter();
  const supabase = createClient();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  // Re-fetch for real-time updates
  const { data: task } = useQuery({
    queryKey: ["task-detail", initialTask.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select(
          "*, assignee:workspace_members!tasks_assignee_id_fkey(id, display_name, user_id), reporter:workspace_members!tasks_reporter_id_fkey(id, display_name, user_id)"
        )
        .eq("id", initialTask.id)
        .single();
      if (error) throw error;

      // Resolve display names from profiles where workspace_members.display_name is null
      const userIdsToResolve: string[] = [];
      const assignee = data.assignee as { id: string; user_id: string; display_name: string | null } | null;
      const reporter = data.reporter as { id: string; user_id: string; display_name: string | null } | null;
      if (assignee && !assignee.display_name) userIdsToResolve.push(assignee.user_id);
      if (reporter && !reporter.display_name) userIdsToResolve.push(reporter.user_id);

      if (userIdsToResolve.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", [...new Set(userIdsToResolve)]);
        const profileMap = new Map(profiles?.map((p) => [p.id, p.display_name]) ?? []);

        return {
          ...data,
          assignee: assignee ? { ...assignee, display_name: assignee.display_name ?? profileMap.get(assignee.user_id) ?? null } : null,
          reporter: reporter ? { ...reporter, display_name: reporter.display_name ?? profileMap.get(reporter.user_id) ?? null } : null,
        };
      }

      return data;
    },
    initialData: initialTask,
  });

  const { data: members } = useQuery({
    queryKey: ["workspace-members-select", workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workspace_members")
        .select("id, display_name, user_id")
        .eq("workspace_id", workspaceId)
        .eq("status", "active");
      if (error) throw error;

      // Resolve display names from profiles where workspace_members.display_name is null
      const nullNameIds = data.filter((m) => !m.display_name).map((m) => m.user_id);
      let profileMap = new Map<string, string>();
      if (nullNameIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", nullNameIds);
        profileMap = new Map(profiles?.map((p) => [p.id, p.display_name]) ?? []);
      }

      return data.map((m) => ({
        ...m,
        display_name: m.display_name || profileMap.get(m.user_id) || null,
      }));
    },
    enabled: !!workspaceId,
  });

  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState(task.title);
  const [editingDesc, setEditingDesc] = useState(false);
  const [description, setDescription] = useState(task.description ?? "");

  const base = `/${workspaceSlug}/projects/${projectSlug}`;

  function handleFieldUpdate(field: string, value: unknown) {
    updateTask.mutate(
      { id: task.id, [field]: value },
      {
        onError: () => toast.error(`Failed to update ${field}`),
      }
    );
  }

  function handleDelete() {
    deleteTask.mutate(
      { id: task.id, projectId },
      {
        onSuccess: () => {
          toast.success("Task deleted");
          router.push(`${base}/board`);
        },
        onError: () => toast.error("Failed to delete task"),
      }
    );
  }

  const assigneeName = (
    task.assignee as { display_name: string | null } | null
  )?.display_name;
  const reporterName = (
    task.reporter as { display_name: string | null } | null
  )?.display_name;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href={`${base}/board`}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <p className="text-sm text-muted-foreground">{projectName}</p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Left Column - 2/3 width */}
        <div className="flex-1 space-y-6 lg:w-2/3">
          {/* Identifier + Title */}
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              {task.identifier}
            </p>
            {editingTitle ? (
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => {
                  if (title && title !== task.title) {
                    handleFieldUpdate("title", title);
                  }
                  setEditingTitle(false);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    if (title && title !== task.title) {
                      handleFieldUpdate("title", title);
                    }
                    setEditingTitle(false);
                  }
                  if (e.key === "Escape") {
                    setTitle(task.title);
                    setEditingTitle(false);
                  }
                }}
                autoFocus
                className="mt-1 text-2xl font-bold"
              />
            ) : (
              <h1
                className="mt-1 cursor-pointer text-2xl font-bold hover:text-primary"
                onClick={() => {
                  setTitle(task.title);
                  setEditingTitle(true);
                }}
              >
                {task.title}
              </h1>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">
              Description
            </label>
            {editingDesc ? (
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => {
                  const newDesc = description || "";
                  if (newDesc !== (task.description || "")) {
                    handleFieldUpdate("description", newDesc || null);
                  }
                  setEditingDesc(false);
                }}
                autoFocus
                rows={8}
                className="mt-1 font-mono text-sm"
                placeholder="Write a description using Markdown..."
              />
            ) : (
              <div
                className="mt-1 min-h-[120px] cursor-pointer rounded-md border p-4 text-sm whitespace-pre-wrap hover:border-primary"
                onClick={() => {
                  setDescription(task.description || "");
                  setEditingDesc(true);
                }}
              >
                {task.description || (
                  <span className="text-muted-foreground">
                    Click to add description...
                  </span>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Subtasks */}
          <SubtaskList
            taskId={task.id}
            projectId={projectId}
            workspaceId={workspaceId}
            currentMemberId={currentMemberId}
            doneStatus={statuses[statuses.length - 1] ?? "Done"}
          />

          <Separator />

          {/* Comments */}
          <TaskComments taskId={task.id} currentMemberId={currentMemberId} />
        </div>

        {/* Right Column - 1/3 width, sticky */}
        <div className="lg:w-1/3">
          <div className="sticky top-4 space-y-4 rounded-lg border p-4">
            {/* Status */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Status
              </label>
              <Select
                value={task.status}
                onValueChange={(v) => handleFieldUpdate("status", v)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Priority */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Priority
              </label>
              <Select
                value={task.priority}
                onValueChange={(v) => handleFieldUpdate("priority", v)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_PRIORITIES.map((p) => (
                    <SelectItem key={p} value={p}>
                      {p.charAt(0).toUpperCase() + p.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Type */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Type
              </label>
              <Select
                value={task.type}
                onValueChange={(v) => handleFieldUpdate("type", v)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TASK_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Assignee */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Assignee
              </label>
              <Select
                value={task.assignee_id ?? "unassigned"}
                onValueChange={(v) =>
                  handleFieldUpdate(
                    "assignee_id",
                    v === "unassigned" ? null : v
                  )
                }
              >
                <SelectTrigger className="mt-1">
                  {task.assignee_id
                    ? members?.find((m) => m.id === task.assignee_id)?.display_name ?? "Unknown"
                    : "Unassigned"}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {members?.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.display_name ?? "Unknown"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Due Date */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Due Date
              </label>
              <DatePicker
                value={task.due_date ? new Date(task.due_date) : null}
                onChange={(date) =>
                  handleFieldUpdate("due_date", date?.toISOString() ?? null)
                }
                placeholder="Set due date..."
                className="mt-1"
              />
            </div>

            {/* Labels */}
            <div>
              <label className="text-xs font-medium text-muted-foreground">
                Labels
              </label>
              <div className="mt-1 flex flex-wrap gap-1">
                {(task.labels ?? []).map((label: string) => (
                  <Badge key={label} variant="secondary" className="gap-1">
                    {label}
                    <button
                      onClick={() =>
                        handleFieldUpdate(
                          "labels",
                          (task.labels ?? []).filter(
                            (l: string) => l !== label
                          )
                        )
                      }
                      className="ml-0.5 hover:text-destructive"
                    >
                      <XIcon className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <Input
                  placeholder="Add label..."
                  className="h-6 w-24 text-xs"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val && !(task.labels ?? []).includes(val)) {
                        handleFieldUpdate("labels", [
                          ...(task.labels ?? []),
                          val,
                        ]);
                        (e.target as HTMLInputElement).value = "";
                      }
                    }
                  }}
                />
              </div>
            </div>

            <Separator />

            {/* Reporter info */}
            <div className="space-y-2 text-xs text-muted-foreground">
              <p>Reporter: {reporterName ?? "Unknown"}</p>
              <p>Created: {new Date(task.created_at!).toLocaleString()}</p>
              {task.completed_at && (
                <p>
                  Completed: {new Date(task.completed_at).toLocaleString()}
                </p>
              )}
            </div>

            <Separator />

            {/* Activity */}
            <TaskActivity taskId={task.id} />

            <Separator />

            {/* Delete button */}
            <AlertDialog>
              <AlertDialogTrigger
                className="inline-flex h-8 w-full items-center justify-center gap-1.5 rounded-lg bg-destructive/10 px-2.5 text-sm font-medium text-destructive hover:bg-destructive/20"
              >
                <Trash2 className="h-4 w-4" />
                Delete task
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Task</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete task {task.identifier}? This
                    action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={handleDelete}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useUpdateTask, useDeleteTask } from "@/hooks/use-tasks";
import { useWorkspaceMembersForSelect } from "@/hooks/use-members";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Trash2, X as XIcon } from "lucide-react";
import { toast } from "sonner";

interface TaskDetailPanelProps {
  taskId: string | null;
  projectId: string;
  statuses: string[];
  workspaceId: string;
  currentMemberId: string;
  onClose: () => void;
}

export function TaskDetailPanel({
  taskId,
  projectId,
  statuses,
  workspaceId,
  currentMemberId,
  onClose,
}: TaskDetailPanelProps) {
  const supabase = createClient();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const { data: task } = useQuery({
    queryKey: ["task-detail", taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select(
          "*, assignee:workspace_members!tasks_assignee_id_fkey(id, display_name, user_id), reporter:workspace_members!tasks_reporter_id_fkey(id, display_name, user_id)"
        )
        .eq("id", taskId!)
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
    enabled: !!taskId,
  });

  const { data: members } = useWorkspaceMembersForSelect(workspaceId);

  const [editingTitle, setEditingTitle] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [editingDesc, setEditingDesc] = useState(false);

  if (!task) return null;

  function handleFieldUpdate(field: string, value: unknown) {
    updateTask.mutate(
      { id: task!.id, [field]: value },
      {
        onError: () => toast.error(`Failed to update ${field}`),
      }
    );
  }

  function handleDelete() {
    if (!confirm("Are you sure you want to delete this task?")) return;
    deleteTask.mutate(
      { id: task!.id, projectId },
      {
        onSuccess: () => {
          toast.success("Task deleted");
          onClose();
        },
      }
    );
  }

  const assigneeName = (task.assignee as { display_name: string | null } | null)?.display_name;
  const reporterName = (task.reporter as { display_name: string | null } | null)?.display_name;

  return (
    <Sheet open={!!taskId} onOpenChange={() => onClose()}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">
            {task.identifier}
          </p>
          {editingTitle ? (
            <Input
              value={title || task.title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => {
                if (title && title !== task.title) handleFieldUpdate("title", title);
                setEditingTitle(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  if (title && title !== task.title) handleFieldUpdate("title", title);
                  setEditingTitle(false);
                }
              }}
              autoFocus
              className="text-lg font-semibold"
            />
          ) : (
            <SheetTitle
              className="cursor-pointer text-lg hover:text-primary"
              onClick={() => {
                setTitle(task.title);
                setEditingTitle(true);
              }}
            >
              {task.title}
            </SheetTitle>
          )}
        </SheetHeader>

        <div className="mt-6 space-y-4">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Status</label>
              <Select
                value={task.status}
                onValueChange={(v) => handleFieldUpdate("status", v)}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Priority</label>
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
            <div>
              <label className="text-xs font-medium text-muted-foreground">Type</label>
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
            <div>
              <label className="text-xs font-medium text-muted-foreground">Assignee</label>
              <Select
                value={task.assignee_id ?? "unassigned"}
                onValueChange={(v) =>
                  handleFieldUpdate("assignee_id", v === "unassigned" ? null : v)
                }
              >
                <SelectTrigger className="mt-1">
                  {task.assignee_id
                    ? members?.find((m) => m.id === task.assignee_id)?.display_name ?? "Unnamed member"
                    : "Unassigned"}
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {members?.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.display_name ?? "Unnamed member"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Due Date</label>
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
            <label className="text-xs font-medium text-muted-foreground">Labels</label>
            <div className="mt-1 flex flex-wrap gap-1">
              {(task.labels ?? []).map((label: string) => (
                <Badge key={label} variant="secondary" className="gap-1">
                  {label}
                  <button
                    onClick={() =>
                      handleFieldUpdate(
                        "labels",
                        (task.labels ?? []).filter((l: string) => l !== label)
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
                      handleFieldUpdate("labels", [...(task.labels ?? []), val]);
                      (e.target as HTMLInputElement).value = "";
                    }
                  }
                }}
              />
            </div>
          </div>

          <Separator />

          {/* Description */}
          <div>
            <label className="text-xs font-medium text-muted-foreground">Description</label>
            {editingDesc ? (
              <Textarea
                value={description || task.description || ""}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => {
                  const newDesc = description || "";
                  if (newDesc !== (task.description || "")) {
                    handleFieldUpdate("description", newDesc || null);
                  }
                  setEditingDesc(false);
                }}
                autoFocus
                rows={6}
                className="mt-1"
              />
            ) : (
              <div
                className="mt-1 min-h-[80px] cursor-pointer rounded-md border p-3 text-sm hover:border-primary"
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

          {/* Metadata Footer */}
          <div className="space-y-2 text-xs text-muted-foreground">
            <p>Reporter: {reporterName ?? "Unnamed member"}</p>
            <p>Created: {new Date(task.created_at!).toLocaleString()}</p>
            {task.completed_at && (
              <p>
                Completed: {new Date(task.completed_at).toLocaleString()}
              </p>
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

          <Separator />

          {/* Activity */}
          <TaskActivity taskId={task.id} />

          <Separator />

          <Button
            variant="destructive"
            size="sm"
            onClick={handleDelete}
            className="w-full"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete task
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

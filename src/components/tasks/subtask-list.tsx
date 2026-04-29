"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useCreateTask, useUpdateTask } from "@/hooks/use-tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { ListTree, Plus } from "lucide-react";
import { toast } from "sonner";

interface SubtaskListProps {
  taskId: string;
  projectId: string;
  workspaceId: string;
  currentMemberId: string;
  doneStatus: string;
}

export function SubtaskList({
  taskId,
  projectId,
  workspaceId,
  currentMemberId,
  doneStatus,
}: SubtaskListProps) {
  const supabase = createClient();
  const createTask = useCreateTask(projectId);
  const updateTask = useUpdateTask();
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);

  const { data: subtasks, isLoading } = useQuery({
    queryKey: ["subtasks", taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("id, title, status, identifier")
        .eq("parent_task_id", taskId)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!taskId,
  });

  function handleAdd() {
    if (!newTitle.trim()) return;
    createTask.mutate(
      {
        title: newTitle.trim(),
        workspace_id: workspaceId,
        reporter_id: currentMemberId,
        parent_task_id: taskId,
        type: "subtask",
      },
      {
        onSuccess: () => {
          setNewTitle("");
          setAdding(false);
        },
        onError: () => toast.error("Failed to create subtask"),
      }
    );
  }

  function handleToggle(subtask: { id: string; status: string }) {
    const isDone = subtask.status === doneStatus;
    updateTask.mutate(
      { id: subtask.id, status: isDone ? "Backlog" : doneStatus },
      { onError: () => toast.error("Failed to update subtask") }
    );
  }

  if (isLoading) {
    return <Skeleton className="h-20 w-full" />;
  }

  const completedCount = subtasks?.filter((s) => s.status === doneStatus).length ?? 0;
  const totalCount = subtasks?.length ?? 0;

  return (
    <div className="space-y-3">
      <h4 className="flex items-center gap-2 text-sm font-medium">
        <ListTree className="h-4 w-4" />
        Subtasks {totalCount > 0 && `(${completedCount}/${totalCount})`}
      </h4>

      {subtasks?.map((subtask) => (
        <div key={subtask.id} className="flex items-center gap-3">
          <Checkbox
            checked={subtask.status === doneStatus}
            onCheckedChange={() => handleToggle(subtask)}
          />
          <span
            className={`text-sm ${
              subtask.status === doneStatus ? "text-muted-foreground line-through" : ""
            }`}
          >
            <span className="mr-1.5 text-xs text-muted-foreground">{subtask.identifier}</span>
            {subtask.title}
          </span>
        </div>
      ))}

      {adding ? (
        <div className="flex gap-2">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Subtask title..."
            autoFocus
            onKeyDown={(e) => {
              if (e.key === "Enter") handleAdd();
              if (e.key === "Escape") setAdding(false);
            }}
          />
          <Button size="sm" onClick={handleAdd} disabled={createTask.isPending}>
            Add
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setAdding(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="ghost"
          className="text-muted-foreground"
          onClick={() => setAdding(true)}
        >
          <Plus className="mr-1 h-3 w-3" /> Add subtask
        </Button>
      )}
    </div>
  );
}

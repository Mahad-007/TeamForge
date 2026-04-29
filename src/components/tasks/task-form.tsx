"use client";

import { useState } from "react";
import { useCreateTask } from "@/hooks/use-tasks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, Plus } from "lucide-react";

interface TaskFormProps {
  projectId: string;
  workspaceId: string;
  currentMemberId: string;
  defaultStatus?: string;
  variant?: "inline" | "dialog";
}

export function TaskForm({
  projectId,
  workspaceId,
  currentMemberId,
  defaultStatus = "Backlog",
  variant = "inline",
}: TaskFormProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState("");
  const createTask = useCreateTask(projectId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    await createTask.mutateAsync({
      title: title.trim(),
      status: defaultStatus,
      workspace_id: workspaceId,
      reporter_id: currentMemberId,
    });

    setTitle("");
    if (variant === "inline") setIsAdding(false);
  }

  if (variant === "inline" && !isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="flex w-full items-center gap-2 rounded-md p-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Plus className="h-4 w-4" />
        Add task
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="p-1">
      <Input
        placeholder="Task title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
        onBlur={() => {
          if (!title.trim()) setIsAdding(false);
        }}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            setTitle("");
            setIsAdding(false);
          }
        }}
        className="text-sm"
      />
      <div className="mt-2 flex gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={!title.trim() || createTask.isPending}
        >
          {createTask.isPending ? (
            <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
            "Add"
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setTitle("");
            setIsAdding(false);
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

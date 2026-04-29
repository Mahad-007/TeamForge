"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Calendar, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";

const priorityConfig: Record<string, { color: string; label: string }> = {
  urgent: { color: "bg-red-500", label: "Urgent" },
  high: { color: "bg-orange-500", label: "High" },
  medium: { color: "bg-amber-500", label: "Medium" },
  low: { color: "bg-blue-500", label: "Low" },
  none: { color: "bg-gray-400", label: "" },
};

export interface TaskCardData {
  id: string;
  identifier: string;
  title: string;
  status: string;
  priority: string;
  type: string;
  due_date: string | null;
  labels: string[] | null;
  assignee?: {
    id: string;
    display_name: string | null;
    user_id: string;
  } | null;
}

interface TaskCardProps {
  task: TaskCardData;
  onClick?: () => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priority = priorityConfig[task.priority] ?? priorityConfig.none;
  const isOverdue =
    task.due_date && new Date(task.due_date) < new Date() && !task.status.toLowerCase().includes("done");
  const assigneeName = task.assignee?.display_name;

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card
        className={cn(
          "cursor-pointer transition-shadow hover:shadow-md",
          isDragging && "opacity-50 shadow-lg"
        )}
        onClick={onClick}
      >
        <CardContent className="p-3">
          <div className="flex items-start gap-2">
            <button
              className="mt-0.5 cursor-grab text-muted-foreground hover:text-foreground active:cursor-grabbing"
              {...listeners}
            >
              <GripVertical className="h-4 w-4" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-medium text-muted-foreground">
                  {task.identifier}
                </span>
                {task.priority !== "none" && (
                  <span
                    className={cn("inline-block h-2 w-2 rounded-full", priority.color)}
                    title={priority.label}
                  />
                )}
              </div>
              <p className="mt-1 line-clamp-2 text-sm font-medium">
                {task.title}
              </p>

              {task.labels && task.labels.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1">
                  {task.labels.slice(0, 2).map((label) => (
                    <Badge
                      key={label}
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                    >
                      {label}
                    </Badge>
                  ))}
                  {task.labels.length > 2 && (
                    <Badge
                      variant="secondary"
                      className="text-[10px] px-1.5 py-0"
                    >
                      +{task.labels.length - 2}
                    </Badge>
                  )}
                </div>
              )}

              <div className="mt-2 flex items-center justify-between">
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
                  <span />
                )}
                {assigneeName && (
                  <Avatar className="h-5 w-5">
                    <AvatarFallback className="text-[10px]">
                      {assigneeName[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

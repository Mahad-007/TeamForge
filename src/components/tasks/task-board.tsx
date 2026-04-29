"use client";

import { useState, useMemo } from "react";
import {
  DndContext,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  DragOverlay,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useDroppable } from "@dnd-kit/core";
import { TaskCard, type TaskCardData } from "./task-card";
import { TaskForm } from "./task-form";
import { useUpdateTask } from "@/hooks/use-tasks";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TaskBoardProps {
  tasks: TaskCardData[];
  statuses: string[];
  projectId: string;
  workspaceId: string;
  currentMemberId: string;
  onTaskClick?: (task: TaskCardData) => void;
}

function Column({
  status,
  tasks,
  children,
}: {
  status: string;
  tasks: TaskCardData[];
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full min-w-0 flex-1 flex-col rounded-lg bg-muted/50",
        isOver && "ring-2 ring-primary/30"
      )}
    >
      <div className="flex items-center gap-2 p-3 pb-2">
        <h3 className="text-sm font-semibold">{status}</h3>
        <Badge variant="secondary" className="text-xs">
          {tasks.length}
        </Badge>
      </div>
      <ScrollArea className="flex-1 px-2 pb-2">
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2">{children}</div>
        </SortableContext>
      </ScrollArea>
    </div>
  );
}

export function TaskBoard({
  tasks,
  statuses,
  projectId,
  workspaceId,
  currentMemberId,
  onTaskClick,
}: TaskBoardProps) {
  const updateTask = useUpdateTask();
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const tasksByStatus = useMemo(() => {
    const map = new Map<string, TaskCardData[]>();
    for (const status of statuses) {
      map.set(status, []);
    }
    for (const task of tasks) {
      const list = map.get(task.status);
      if (list) list.push(task);
      else {
        // Task has a status not in the project's statuses — add to first column
        const first = map.get(statuses[0]);
        if (first) first.push(task);
      }
    }
    return map;
  }, [tasks, statuses]);

  const activeTask = activeId
    ? tasks.find((t) => t.id === activeId)
    : null;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const taskId = active.id as string;
    const overStatus =
      statuses.includes(over.id as string)
        ? (over.id as string)
        : tasks.find((t) => t.id === over.id)?.status;

    if (!overStatus) return;

    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === overStatus) return;

    updateTask.mutate({ id: taskId, status: overStatus });
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={(e) => setActiveId(e.active.id as string)}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4" style={{ height: "calc(100vh - 220px)" }}>
        {statuses.map((status) => {
          const columnTasks = tasksByStatus.get(status) ?? [];
          return (
            <Column key={status} status={status} tasks={columnTasks}>
              {columnTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => onTaskClick?.(task)}
                />
              ))}
              <TaskForm
                projectId={projectId}
                workspaceId={workspaceId}
                currentMemberId={currentMemberId}
                defaultStatus={status}
                variant="inline"
              />
            </Column>
          );
        })}
      </div>

      <DragOverlay>
        {activeTask && <TaskCard task={activeTask} />}
      </DragOverlay>
    </DndContext>
  );
}

"use client";

import { useMemo } from "react";
import { differenceInDays, format, startOfMonth, endOfMonth, eachDayOfInterval, addMonths, subMonths } from "date-fns";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useState } from "react";

interface Task {
  id: string;
  identifier: string;
  title: string;
  status: string;
  priority: string;
  due_date: string | null;
  created_at: string | null;
  assignee?: { display_name: string | null } | null;
}

const priorityColors: Record<string, string> = {
  urgent: "bg-red-500",
  high: "bg-orange-500",
  medium: "bg-amber-500",
  low: "bg-blue-500",
  none: "bg-gray-400",
};

interface TimelineViewProps {
  tasks: Task[];
}

export function TimelineView({ tasks }: TimelineViewProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const tasksWithDates = useMemo(
    () => tasks.filter((t) => t.due_date || t.created_at),
    [tasks]
  );

  return (
    <div className="space-y-4">
      {/* Month navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="text-sm font-semibold">
          {format(currentMonth, "MMMM yyyy")}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Timeline grid */}
      <div className="overflow-x-auto rounded-lg border">
        {/* Day headers */}
        <div className="flex border-b bg-muted/50">
          <div className="w-48 shrink-0 border-r px-3 py-2 text-xs font-medium text-muted-foreground">
            Task
          </div>
          <div className="flex flex-1">
            {days.map((day) => (
              <div
                key={day.toISOString()}
                className={cn(
                  "flex-1 min-w-[28px] border-r px-0.5 py-2 text-center text-[10px]",
                  day.getDay() === 0 || day.getDay() === 6
                    ? "bg-muted/30 text-muted-foreground"
                    : "text-foreground"
                )}
              >
                {format(day, "d")}
              </div>
            ))}
          </div>
        </div>

        {/* Task rows */}
        {tasksWithDates.length > 0 ? (
          tasksWithDates.map((task) => {
            const startDate = new Date(task.created_at ?? task.due_date!);
            const endDate = task.due_date ? new Date(task.due_date) : startDate;

            const startOffset = Math.max(differenceInDays(startDate, monthStart), 0);
            const duration = Math.max(differenceInDays(endDate, startDate), 1);
            const barEnd = Math.min(startOffset + duration, days.length);

            return (
              <div key={task.id} className="flex border-b last:border-0">
                <div className="w-48 shrink-0 border-r px-3 py-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "h-2 w-2 shrink-0 rounded-full",
                        priorityColors[task.priority]
                      )}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">
                        {task.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground">
                        {task.identifier}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="relative flex flex-1 items-center">
                  {startOffset < days.length && (
                    <div
                      className={cn(
                        "absolute h-5 rounded-full",
                        task.status.toLowerCase().includes("done")
                          ? "bg-success/60"
                          : "bg-primary/60"
                      )}
                      style={{
                        left: `${(startOffset / days.length) * 100}%`,
                        width: `${(Math.min(duration, barEnd - startOffset) / days.length) * 100}%`,
                        minWidth: "8px",
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="p-8 text-center text-sm text-muted-foreground">
            No tasks with dates to display.
          </div>
        )}
      </div>
    </div>
  );
}

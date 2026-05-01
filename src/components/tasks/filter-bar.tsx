"use client";

import { TASK_PRIORITIES } from "@/types/enums";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { X } from "lucide-react";

interface FilterBarProps {
  statuses: string[];
  members: { id: string; display_name: string | null }[];
  filters: { status?: string; assignee_id?: string; priority?: string };
  onFilterChange: (filters: {
    status?: string;
    assignee_id?: string;
    priority?: string;
  }) => void;
}

export function FilterBar({
  statuses,
  members,
  filters,
  onFilterChange,
}: FilterBarProps) {
  const hasActiveFilters =
    !!filters.status || !!filters.assignee_id || !!filters.priority;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Status filter */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Status:</span>
        <Select
          value={filters.status ?? "all"}
          onValueChange={(val) =>
            onFilterChange({
              ...filters,
              status: !val || val === "all" ? undefined : val,
            })
          }
        >
          <SelectTrigger size="sm">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Priority filter */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Priority:</span>
        <Select
          value={filters.priority ?? "all"}
          onValueChange={(val) =>
            onFilterChange({
              ...filters,
              priority: !val || val === "all" ? undefined : val,
            })
          }
        >
          <SelectTrigger size="sm">
            <SelectValue placeholder="Priority" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All priorities</SelectItem>
            {TASK_PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>
                <span className="capitalize">{p}</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Assignee filter */}
      <div className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Assignee:</span>
        <Select
          value={filters.assignee_id ?? "all"}
          onValueChange={(val) =>
            onFilterChange({
              ...filters,
              assignee_id: !val || val === "all" ? undefined : val,
            })
          }
        >
          <SelectTrigger size="sm">
            <SelectValue placeholder="Assignee" />
          </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All assignees</SelectItem>
          {members.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.display_name ?? "Unknown"}
            </SelectItem>
          ))}
        </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="xs"
          onClick={() => onFilterChange({})}
        >
          <X className="mr-1 h-3 w-3" />
          Clear filters
        </Button>
      )}
    </div>
  );
}

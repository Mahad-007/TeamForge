"use client";

import { useState } from "react";
import {
  useSavedViews,
  useCreateView,
  useDeleteView,
} from "@/hooks/use-saved-views";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Bookmark, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

interface SavedViewsDropdownProps {
  projectId: string;
  workspaceId: string;
  currentMemberId: string;
  currentFilters: {
    status?: string;
    assignee_id?: string;
    priority?: string;
  };
  onApplyView: (filters: {
    status?: string;
    assignee_id?: string;
    priority?: string;
  }) => void;
}

export function SavedViewsDropdown({
  projectId,
  workspaceId,
  currentMemberId,
  currentFilters,
  onApplyView,
}: SavedViewsDropdownProps) {
  const { data: views } = useSavedViews(projectId);
  const createView = useCreateView(projectId);
  const deleteView = useDeleteView(projectId);

  const [showNameInput, setShowNameInput] = useState(false);
  const [viewName, setViewName] = useState("");

  const handleSave = () => {
    const name = viewName.trim();
    if (!name) return;

    createView.mutate(
      {
        name,
        type: "task",
        filters: currentFilters as Record<string, string>,
        workspace_id: workspaceId,
        created_by: currentMemberId,
        is_shared: false,
      },
      {
        onSuccess: () => {
          toast.success("View saved");
          setViewName("");
          setShowNameInput(false);
        },
        onError: () => {
          toast.error("Failed to save view");
        },
      }
    );
  };

  const handleDelete = (viewId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteView.mutate(viewId, {
      onSuccess: () => toast.success("View deleted"),
      onError: () => toast.error("Failed to delete view"),
    });
  };

  const handleApply = (filters: unknown) => {
    const f = (filters ?? {}) as Record<string, string>;
    onApplyView({
      status: f.status || undefined,
      assignee_id: f.assignee_id || undefined,
      priority: f.priority || undefined,
    });
  };

  return (
    <Popover>
      <PopoverTrigger
        className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm font-medium whitespace-nowrap transition-colors hover:bg-muted hover:text-foreground h-7 rounded-[min(var(--radius-md),12px)]"
      >
        <Bookmark className="h-3.5 w-3.5" />
        Views
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-0">
        <div className="p-2 border-b">
          <p className="text-xs font-medium text-muted-foreground">
            Saved views
          </p>
        </div>

        <div className="max-h-48 overflow-y-auto">
          {views && views.length > 0 ? (
            views.map((view) => (
              <div
                key={view.id}
                className="flex items-center justify-between px-2 py-1.5 text-sm cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleApply(view.filters)}
              >
                <span className="truncate">{view.name}</span>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="shrink-0 opacity-0 group-hover:opacity-100 hover:opacity-100 hover:text-destructive"
                  onClick={(e) => handleDelete(view.id, e)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))
          ) : (
            <div className="px-2 py-3 text-center text-xs text-muted-foreground">
              No saved views yet
            </div>
          )}
        </div>

        <div className="border-t p-2">
          {showNameInput ? (
            <div className="flex items-center gap-1.5">
              <Input
                value={viewName}
                onChange={(e) => setViewName(e.target.value)}
                placeholder="View name..."
                className="h-7 text-xs"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSave();
                  if (e.key === "Escape") {
                    setShowNameInput(false);
                    setViewName("");
                  }
                }}
                autoFocus
              />
              <Button
                size="xs"
                onClick={handleSave}
                disabled={!viewName.trim() || createView.isPending}
              >
                Save
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-xs"
              onClick={() => setShowNameInput(true)}
            >
              <Plus className="mr-1.5 h-3 w-3" />
              Save current view
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

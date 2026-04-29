"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, X } from "lucide-react";

interface BulkActionToolbarProps {
  selectedCount: number;
  statuses: string[];
  members: { id: string; display_name: string | null }[];
  onBulkStatusChange: (status: string) => void;
  onBulkAssign: (assigneeId: string | null) => void;
  onBulkDelete: () => void;
  onClearSelection: () => void;
}

export function BulkActionToolbar({
  selectedCount,
  statuses,
  members,
  onBulkStatusChange,
  onBulkAssign,
  onBulkDelete,
  onClearSelection,
}: BulkActionToolbarProps) {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  if (selectedCount === 0) return null;

  return (
    <>
      <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-lg border bg-popover px-4 py-2.5 shadow-lg ring-1 ring-foreground/10">
        <Badge variant="secondary" className="tabular-nums">
          {selectedCount} task{selectedCount !== 1 ? "s" : ""} selected
        </Badge>

        {/* Status change */}
        <Select
          value=""
          onValueChange={(val) => {
            if (val) onBulkStatusChange(val);
          }}
        >
          <SelectTrigger size="sm">
            <span className="text-xs">Set status</span>
          </SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Assign */}
        <Select
          value=""
          onValueChange={(val) => {
            onBulkAssign(val === "__unassign__" ? null : val);
          }}
        >
          <SelectTrigger size="sm">
            <span className="text-xs">Assign to</span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__unassign__">Unassign</SelectItem>
            {members.map((m) => (
              <SelectItem key={m.id} value={m.id}>
                {m.display_name ?? "Unknown"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Delete */}
        <Button
          variant="destructive"
          size="sm"
          onClick={() => setShowDeleteConfirm(true)}
        >
          <Trash2 className="mr-1 h-3.5 w-3.5" />
          Delete
        </Button>

        {/* Clear selection */}
        <Button variant="ghost" size="icon-sm" onClick={onClearSelection}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <AlertDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedCount} tasks?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The selected tasks will be
              permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => {
                onBulkDelete();
                setShowDeleteConfirm(false);
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

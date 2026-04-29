"use client";

import { useState } from "react";
import { useUpdateWikiPage } from "@/hooks/use-wiki";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { History, Download } from "lucide-react";

interface PageHeaderProps {
  pageId: string;
  title: string;
  icon: string | null;
  lastEditorName: string | null;
  updatedAt: string | null;
  memberId: string;
  onShowHistory: () => void;
}

export function PageHeader({
  pageId,
  title,
  icon,
  lastEditorName,
  updatedAt,
  memberId,
  onShowHistory,
}: PageHeaderProps) {
  const [editing, setEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);
  const updatePage = useUpdateWikiPage();

  function handleSaveTitle() {
    if (editTitle.trim() && editTitle !== title) {
      updatePage.mutate({ id: pageId, memberId, title: editTitle.trim() });
    }
    setEditing(false);
  }

  return (
    <div className="border-b px-8 py-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {icon && <span className="text-2xl">{icon}</span>}
            {editing ? (
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                onBlur={handleSaveTitle}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSaveTitle();
                  if (e.key === "Escape") {
                    setEditTitle(title);
                    setEditing(false);
                  }
                }}
                autoFocus
                className="text-2xl font-bold border-none shadow-none px-0 focus-visible:ring-0"
              />
            ) : (
              <h1
                className="cursor-pointer text-2xl font-bold hover:text-primary"
                onClick={() => {
                  setEditTitle(title);
                  setEditing(true);
                }}
              >
                {title}
              </h1>
            )}
          </div>
          {updatedAt && (
            <p className="mt-1 text-xs text-muted-foreground">
              Last edited by {lastEditorName ?? "Unknown"}{" "}
              {formatDistanceToNow(new Date(updatedAt), { addSuffix: true })}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={onShowHistory}
          >
            <History className="h-3.5 w-3.5" />
            History
          </Button>
        </div>
      </div>
    </div>
  );
}

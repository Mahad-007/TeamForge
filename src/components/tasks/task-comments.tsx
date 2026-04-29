"use client";

import { useState } from "react";
import { useTaskComments, useCreateComment, useEditComment, useDeleteComment } from "@/hooks/use-task-comments";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageSquare, Pencil, Trash2, X, Check } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface TaskCommentsProps {
  taskId: string;
  currentMemberId: string;
}

export function TaskComments({ taskId, currentMemberId }: TaskCommentsProps) {
  const { data: comments, isLoading } = useTaskComments(taskId);
  const createComment = useCreateComment(taskId);
  const editComment = useEditComment();
  const deleteComment = useDeleteComment();
  const [newComment, setNewComment] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  function handleSubmit() {
    if (!newComment.trim()) return;
    createComment.mutate(
      { content: newComment.trim(), author_id: currentMemberId },
      {
        onSuccess: () => setNewComment(""),
        onError: () => toast.error("Failed to add comment"),
      }
    );
  }

  function handleEdit(commentId: string) {
    if (!editContent.trim()) return;
    editComment.mutate(
      { id: commentId, content: editContent.trim(), taskId },
      {
        onSuccess: () => setEditingId(null),
        onError: () => toast.error("Failed to edit comment"),
      }
    );
  }

  function handleDelete(commentId: string) {
    deleteComment.mutate(
      { id: commentId, taskId },
      { onError: () => toast.error("Failed to delete comment") }
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-16 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h4 className="flex items-center gap-2 text-sm font-medium">
        <MessageSquare className="h-4 w-4" />
        Comments ({comments?.length ?? 0})
      </h4>

      {comments?.map((comment) => {
        const author = comment.author as { id: string; display_name: string | null; user_id: string } | null;
        const authorName = author?.display_name ?? "Unknown";
        const isOwn = author?.id === currentMemberId;

        return (
          <div key={comment.id} className="group flex gap-3">
            <Avatar className="h-7 w-7 shrink-0">
              <AvatarFallback className="text-xs">
                {authorName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{authorName}</span>
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(comment.created_at!), { addSuffix: true })}
                </span>
                {comment.is_edited && (
                  <span className="text-xs text-muted-foreground">(edited)</span>
                )}
                {isOwn && editingId !== comment.id && (
                  <div className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100">
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => {
                        setEditingId(comment.id);
                        setEditContent(comment.content);
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon-xs"
                      onClick={() => handleDelete(comment.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              {editingId === comment.id ? (
                <div className="space-y-2">
                  <Textarea
                    value={editContent}
                    onChange={(e) => setEditContent(e.target.value)}
                    rows={2}
                    autoFocus
                  />
                  <div className="flex gap-1">
                    <Button size="xs" onClick={() => handleEdit(comment.id)}>
                      <Check className="mr-1 h-3 w-3" /> Save
                    </Button>
                    <Button size="xs" variant="ghost" onClick={() => setEditingId(null)}>
                      <X className="mr-1 h-3 w-3" /> Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
              )}
            </div>
          </div>
        );
      })}

      <div className="space-y-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Write a comment..."
          rows={2}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleSubmit();
          }}
        />
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={!newComment.trim() || createComment.isPending}
        >
          {createComment.isPending ? "Sending..." : "Comment"}
        </Button>
      </div>
    </div>
  );
}

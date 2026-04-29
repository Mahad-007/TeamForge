"use client";

import { useState } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useEditMessage, useDeleteMessage, useToggleReaction, usePinMessage } from "@/hooks/use-messages";
import { useChatStore } from "@/stores/chat";
import { formatDistanceToNow } from "date-fns";
import { MoreHorizontal, Reply, Smile, Pin, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";

interface MessageItemProps {
  message: {
    id: string;
    content: string;
    type: string;
    is_edited: boolean | null;
    is_deleted: boolean | null;
    is_pinned: boolean | null;
    created_at: string | null;
    reactions: unknown;
    thread_id: string | null;
    sender: { id: string; display_name: string | null; user_id: string } | null;
  };
  channelId: string;
  currentMemberId: string;
  threadReplyCount?: number;
}

const QUICK_EMOJIS = ["\u{1F44D}", "\u{2764}\u{FE0F}", "\u{1F604}", "\u{1F389}", "\u{1F440}", "\u{1F4AF}"];

export function MessageItem({
  message,
  channelId,
  currentMemberId,
  threadReplyCount,
}: MessageItemProps) {
  const { setOpenThread } = useChatStore();
  const editMessage = useEditMessage();
  const deleteMessage = useDeleteMessage();
  const toggleReaction = useToggleReaction();
  const pinMessage = usePinMessage();

  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [showReactions, setShowReactions] = useState(false);

  const isMine = message.sender?.id === currentMemberId;
  const senderName = message.sender?.display_name ?? "Unknown";
  const reactions = (message.reactions ?? {}) as Record<string, string[]>;

  if (message.is_deleted) {
    return (
      <div className="px-4 py-1.5 text-sm italic text-muted-foreground">
        Message deleted
      </div>
    );
  }

  function handleEdit() {
    if (!editContent.trim()) return;
    editMessage.mutate({
      id: message.id,
      content: editContent.trim(),
      channelId,
    });
    setEditing(false);
  }

  return (
    <div className="group relative flex gap-3 px-4 py-1.5 hover:bg-muted/30">
      <Avatar className="mt-0.5 h-8 w-8 shrink-0">
        <AvatarFallback className="text-xs">
          {senderName[0]?.toUpperCase()}
        </AvatarFallback>
      </Avatar>

      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold">{senderName}</span>
          <span className="text-[10px] text-muted-foreground">
            {message.created_at &&
              formatDistanceToNow(new Date(message.created_at), {
                addSuffix: true,
              })}
          </span>
          {message.is_edited && (
            <span className="text-[10px] text-muted-foreground">(edited)</span>
          )}
          {message.is_pinned && (
            <Pin className="h-3 w-3 text-primary" />
          )}
        </div>

        {editing ? (
          <div className="mt-1 flex gap-2">
            <Input
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleEdit();
                if (e.key === "Escape") setEditing(false);
              }}
              autoFocus
              className="text-sm"
            />
            <Button size="sm" onClick={handleEdit}>
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none text-sm [&>p]:mb-1 [&>p]:mt-0">
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}

        {/* Reactions */}
        {Object.keys(reactions).length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {Object.entries(reactions).map(([emoji, userIds]) => (
              <button
                key={emoji}
                onClick={() =>
                  toggleReaction.mutate({
                    messageId: message.id,
                    emoji,
                    memberId: currentMemberId,
                    channelId,
                  })
                }
                className={cn(
                  "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs transition-colors hover:bg-accent",
                  userIds.includes(currentMemberId) && "border-primary bg-primary/10"
                )}
              >
                {emoji} {userIds.length}
              </button>
            ))}
          </div>
        )}

        {/* Thread reply count */}
        {threadReplyCount !== undefined && threadReplyCount > 0 && (
          <button
            onClick={() => setOpenThread(message.id)}
            className="mt-1 text-xs font-medium text-primary hover:underline"
          >
            {threadReplyCount} {threadReplyCount === 1 ? "reply" : "replies"}
          </button>
        )}
      </div>

      {/* Hover actions */}
      <div className="absolute -top-3 right-4 hidden gap-0.5 rounded-md border bg-background p-0.5 shadow-sm group-hover:flex">
        <button
          className="rounded p-1 hover:bg-accent"
          onClick={() => setShowReactions(!showReactions)}
        >
          <Smile className="h-3.5 w-3.5" />
        </button>
        <button
          className="rounded p-1 hover:bg-accent"
          onClick={() => setOpenThread(message.id)}
        >
          <Reply className="h-3.5 w-3.5" />
        </button>
        {isMine && (
          <DropdownMenu>
            <DropdownMenuTrigger className="rounded p-1 hover:bg-accent">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  setEditContent(message.content);
                  setEditing(true);
                }}
              >
                <Pencil className="mr-2 h-3.5 w-3.5" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  pinMessage.mutate({
                    messageId: message.id,
                    pinned: !message.is_pinned,
                    channelId,
                  })
                }
              >
                <Pin className="mr-2 h-3.5 w-3.5" />
                {message.is_pinned ? "Unpin" : "Pin"}
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() =>
                  deleteMessage.mutate({ id: message.id, channelId })
                }
              >
                <Trash2 className="mr-2 h-3.5 w-3.5" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Quick reaction picker */}
      {showReactions && (
        <div className="absolute -top-8 right-4 flex gap-1 rounded-md border bg-background p-1 shadow-md">
          {QUICK_EMOJIS.map((emoji) => (
            <button
              key={emoji}
              className="rounded p-1 text-sm hover:bg-accent"
              onClick={() => {
                toggleReaction.mutate({
                  messageId: message.id,
                  emoji,
                  memberId: currentMemberId,
                  channelId,
                });
                setShowReactions(false);
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

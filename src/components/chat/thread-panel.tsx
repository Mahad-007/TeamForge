"use client";

import { useThreadMessages, useSendMessage } from "@/hooks/use-messages";
import { useChatStore } from "@/stores/chat";
import { MessageItem } from "./message-item";
import { MessageInput } from "./message-input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { X } from "lucide-react";

interface ThreadPanelProps {
  channelId: string;
  currentMemberId: string;
  parentMessage: {
    id: string;
    content: string;
    sender: { id: string; display_name: string | null; user_id: string } | null;
    created_at: string | null;
  } | null;
}

export function ThreadPanel({
  channelId,
  currentMemberId,
  parentMessage,
}: ThreadPanelProps) {
  const { openThreadId, setOpenThread } = useChatStore();
  const { data: replies } = useThreadMessages(openThreadId);

  if (!openThreadId || !parentMessage) return null;

  return (
    <div className="flex h-full w-96 flex-col border-l bg-background">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <h3 className="text-sm font-semibold">Thread</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => setOpenThread(null)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        {/* Parent message */}
        <MessageItem
          message={{
            ...parentMessage,
            type: "text",
            is_edited: false,
            is_deleted: false,
            is_pinned: false,
            reactions: {},
            thread_id: null,
          }}
          channelId={channelId}
          currentMemberId={currentMemberId}
        />

        <Separator />

        {/* Thread replies */}
        <div className="py-2">
          {replies && replies.length > 0 ? (
            replies.map((reply) => (
              <MessageItem
                key={reply.id}
                message={reply}
                channelId={channelId}
                currentMemberId={currentMemberId}
              />
            ))
          ) : (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">
              No replies yet. Start a thread!
            </p>
          )}
        </div>
      </ScrollArea>

      <MessageInput
        channelId={channelId}
        currentMemberId={currentMemberId}
        threadId={openThreadId}
        placeholder="Reply in thread..."
      />
    </div>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { useMessages } from "@/hooks/use-messages";
import { MessageItem } from "./message-item";
import { Skeleton } from "@/components/ui/skeleton";

interface MessageListProps {
  channelId: string;
  currentMemberId: string;
}

export function MessageList({ channelId, currentMemberId }: MessageListProps) {
  const { data: messages, isLoading } = useMessages(channelId);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages && messages.length > prevCountRef.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevCountRef.current = messages?.length ?? 0;
  }, [messages?.length]);

  // Initial scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView();
  }, [channelId]);

  if (isLoading) {
    return (
      <div className="flex-1 space-y-4 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {messages && messages.length > 0 ? (
        <div className="py-4">
          {messages.map((message) => (
            <MessageItem
              key={message.id}
              message={message}
              channelId={channelId}
              currentMemberId={currentMemberId}
            />
          ))}
        </div>
      ) : (
        <div className="flex h-full items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p className="text-lg font-medium">No messages yet</p>
            <p className="text-sm">Start the conversation!</p>
          </div>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  );
}

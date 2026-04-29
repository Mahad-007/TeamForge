"use client";

import { useMemo } from "react";
import { useMessages } from "@/hooks/use-messages";
import { useTyping } from "@/hooks/use-typing";
import { useChatStore } from "@/stores/chat";
import { ChannelHeader } from "@/components/chat/channel-header";
import { MessageList } from "@/components/chat/message-list";
import { MessageInput } from "@/components/chat/message-input";
import { TypingIndicator } from "@/components/chat/typing-indicator";
import { ThreadPanel } from "@/components/chat/thread-panel";
import { ChannelInfoSidebar } from "@/components/chat/channel-info-sidebar";

interface ChannelViewProps {
  channelId: string;
  workspaceId: string;
  currentMemberId: string;
  currentMemberName: string;
}

export function ChannelView({
  channelId,
  workspaceId,
  currentMemberId,
  currentMemberName,
}: ChannelViewProps) {
  const { openThreadId, showInfoSidebar, setShowInfoSidebar } = useChatStore();
  const { data: messages } = useMessages(channelId);
  const { typingUsers, sendTyping } = useTyping(channelId, currentMemberName);

  const parentMessage = useMemo(() => {
    if (!openThreadId || !messages) return null;
    return messages.find((m) => m.id === openThreadId) ?? null;
  }, [openThreadId, messages]);

  return (
    <div className="flex h-full">
      <div className="flex flex-1 flex-col overflow-hidden">
        <ChannelHeader channelId={channelId} />
        <MessageList
          channelId={channelId}
          currentMemberId={currentMemberId}
        />
        <TypingIndicator typingUsers={typingUsers} />
        <MessageInput
          channelId={channelId}
          currentMemberId={currentMemberId}
          workspaceId={workspaceId}
          onTyping={sendTyping}
        />
      </div>

      {openThreadId && (
        <ThreadPanel
          channelId={channelId}
          currentMemberId={currentMemberId}
          parentMessage={parentMessage}
        />
      )}

      {showInfoSidebar && (
        <ChannelInfoSidebar
          channelId={channelId}
          onClose={() => setShowInfoSidebar(false)}
        />
      )}
    </div>
  );
}

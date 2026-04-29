"use client";

import { ChannelList } from "@/components/chat/channel-list";

interface ChatLayoutClientProps {
  workspaceId: string;
  workspaceSlug: string;
  currentMemberId: string;
  currentMemberName: string;
  children: React.ReactNode;
}

export function ChatLayoutClient({
  workspaceId,
  workspaceSlug,
  currentMemberId,
  currentMemberName,
  children,
}: ChatLayoutClientProps) {
  return (
    <div className="-m-6 flex h-[calc(100vh-3.5rem)]">
      <ChannelList
        workspaceId={workspaceId}
        workspaceSlug={workspaceSlug}
        currentMemberId={currentMemberId}
      />
      <div className="flex flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}

"use client";

import { useChannel, useChannelMembers } from "@/hooks/use-channels";
import { useChatStore } from "@/stores/chat";
import { Button } from "@/components/ui/button";
import { Hash, Lock, Users, Pin, Info } from "lucide-react";

interface ChannelHeaderProps {
  channelId: string;
}

export function ChannelHeader({ channelId }: ChannelHeaderProps) {
  const { data: channel } = useChannel(channelId);
  const { data: members } = useChannelMembers(channelId);
  const { setShowInfoSidebar, showInfoSidebar } = useChatStore();

  if (!channel) return null;

  const icon =
    channel.type === "private" ? (
      <Lock className="h-4 w-4" />
    ) : (
      <Hash className="h-4 w-4" />
    );

  return (
    <div className="flex h-12 items-center justify-between border-b px-4">
      <div className="flex items-center gap-2">
        {icon}
        <h2 className="text-sm font-semibold">{channel.name}</h2>
        {channel.description && (
          <span className="hidden text-xs text-muted-foreground sm:inline">
            {channel.description}
          </span>
        )}
      </div>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="sm" className="h-8 gap-1.5 text-xs">
          <Users className="h-3.5 w-3.5" />
          {members?.length ?? 0}
        </Button>
        <Button
          variant={showInfoSidebar ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => setShowInfoSidebar(!showInfoSidebar)}
        >
          <Info className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

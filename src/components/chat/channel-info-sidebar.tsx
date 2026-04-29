"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useChannel, useChannelMembers } from "@/hooks/use-channels";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Hash, Lock, X, Pin, Calendar, Users, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChannelInfoSidebarProps {
  channelId: string;
  onClose: () => void;
}

function usePinnedMessages(channelId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["pinned-messages", channelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select(
          "id, content, created_at, is_pinned, sender:workspace_members!messages_sender_id_fkey(id, display_name)"
        )
        .eq("channel_id", channelId)
        .eq("is_pinned", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!channelId,
  });
}

export function ChannelInfoSidebar({
  channelId,
  onClose,
}: ChannelInfoSidebarProps) {
  const { data: channel } = useChannel(channelId);
  const { data: members } = useChannelMembers(channelId);
  const { data: pinnedMessages } = usePinnedMessages(channelId);

  if (!channel) return null;

  const icon =
    channel.type === "private" ? (
      <Lock className="h-5 w-5 text-muted-foreground" />
    ) : (
      <Hash className="h-5 w-5 text-muted-foreground" />
    );

  const createdDate = channel.created_at
    ? new Date(channel.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="flex h-full w-80 flex-col border-l bg-background">
      {/* Header */}
      <div className="flex h-12 items-center justify-between border-b px-4">
        <h3 className="text-sm font-semibold">Channel Details</h3>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-5">
          {/* Channel info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {icon}
              <h2 className="text-lg font-semibold">{channel.name}</h2>
            </div>
            {channel.description && (
              <p className="text-sm text-muted-foreground">
                {channel.description}
              </p>
            )}
            <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" />
                <span className="capitalize">{channel.type} channel</span>
              </div>
              {createdDate && (
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  <span>Created {createdDate}</span>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Members */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">
                Members ({members?.length ?? 0})
              </h4>
            </div>
            <div className="space-y-1">
              {members?.map((cm) => {
                const member = cm.member as {
                  id: string;
                  display_name: string | null;
                  user_id: string;
                } | null;
                const name = member?.display_name ?? "Unknown";
                const initials = name
                  .split(" ")
                  .map((w) => w[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2);

                return (
                  <div
                    key={cm.id ?? member?.id}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5"
                  >
                    <Avatar size="sm">
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm">{name}</p>
                      {cm.role && (
                        <p className="text-[10px] capitalize text-muted-foreground">
                          {cm.role}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
              {(!members || members.length === 0) && (
                <p className="px-2 text-xs text-muted-foreground">
                  No members found
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Pinned messages */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <Pin className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-medium">
                Pinned Messages ({pinnedMessages?.length ?? 0})
              </h4>
            </div>
            <div className="space-y-2">
              {pinnedMessages?.map((msg) => {
                const sender = msg.sender as {
                  id: string;
                  display_name: string | null;
                } | null;
                const senderName = sender?.display_name ?? "Unknown";
                const date = new Date(msg.created_at!).toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric" }
                );

                return (
                  <div
                    key={msg.id}
                    className="rounded-md border bg-muted/30 p-2.5 text-sm"
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-xs font-medium">{senderName}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {date}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-3">
                      {msg.content}
                    </p>
                  </div>
                );
              })}
              {(!pinnedMessages || pinnedMessages.length === 0) && (
                <p className="px-2 text-xs text-muted-foreground">
                  No pinned messages yet
                </p>
              )}
            </div>
          </div>
        </div>
      </ScrollArea>
    </div>
  );
}

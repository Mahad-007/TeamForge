"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useChannels, useCreateChannel } from "@/hooks/use-channels";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Hash, Lock, MessageSquare, Plus, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ChannelListProps {
  workspaceId: string;
  workspaceSlug: string;
  currentMemberId: string;
}

export function ChannelList({
  workspaceId,
  workspaceSlug,
  currentMemberId,
}: ChannelListProps) {
  const pathname = usePathname();
  const { data: channels } = useChannels(workspaceId);
  const createChannel = useCreateChannel(workspaceId);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState<"public" | "private">("public");

  const publicChannels = channels?.filter(
    (c) => c.type === "public" || c.type === "project"
  );
  const privateChannels = channels?.filter((c) => c.type === "private");
  const dmChannels = channels?.filter((c) => c.type === "dm");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    try {
      const channel = await createChannel.mutateAsync({
        name: newName.toLowerCase().replace(/\s+/g, "-"),
        type: newType,
        created_by: currentMemberId,
      });
      setDialogOpen(false);
      setNewName("");
    } catch {
      toast.error("Failed to create channel");
    }
  }

  function ChannelItem({
    channel,
  }: {
    channel: {
      id: string;
      name: string;
      type: string;
      last_message_at: string | null;
      channel_members: { last_read_at: string | null; member_id: string }[];
    };
  }) {
    const href = `/${workspaceSlug}/chat/${channel.id}`;
    const isActive = pathname === href;

    // Determine unread status by comparing last_message_at with member's last_read_at
    const memberEntry = channel.channel_members?.find(
      (m) => m.member_id === currentMemberId
    );
    const isUnread =
      !isActive &&
      !!channel.last_message_at &&
      (!memberEntry?.last_read_at ||
        new Date(channel.last_message_at) > new Date(memberEntry.last_read_at));

    const icon =
      channel.type === "private" ? (
        <Lock className="h-3.5 w-3.5 shrink-0" />
      ) : channel.type === "dm" ? (
        <MessageSquare className="h-3.5 w-3.5 shrink-0" />
      ) : (
        <Hash className="h-3.5 w-3.5 shrink-0" />
      );

    return (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
          isActive
            ? "bg-accent font-medium text-accent-foreground"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
          isUnread && "font-semibold text-foreground"
        )}
      >
        {icon}
        <span className="flex-1 truncate">
          {channel.type === "dm"
            ? channel.name.replace("dm-", "").slice(0, 8) + "..."
            : channel.name}
        </span>
        {isUnread && (
          <span className="ml-auto h-2 w-2 shrink-0 rounded-full bg-blue-500" />
        )}
      </Link>
    );
  }

  return (
    <div className="flex h-full w-64 flex-col border-r bg-muted/30">
      <div className="flex items-center justify-between border-b px-3 py-3">
        <h2 className="text-sm font-semibold">Chat</h2>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger className="inline-flex h-7 w-7 items-center justify-center rounded-md hover:bg-accent">
            <Plus className="h-4 w-4" />
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Create channel</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-2">
                <Label>Name</Label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. engineering"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={newType}
                  onValueChange={(v) => v && setNewType(v as "public" | "private")}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public</SelectItem>
                    <SelectItem value="private">Private</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={createChannel.isPending || !newName}
              >
                {createChannel.isPending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className="flex-1 p-2">
        {publicChannels && publicChannels.length > 0 && (
          <div className="mb-3">
            <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Channels
            </p>
            {publicChannels.map((c) => (
              <ChannelItem key={c.id} channel={c} />
            ))}
          </div>
        )}

        {privateChannels && privateChannels.length > 0 && (
          <div className="mb-3">
            <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Private
            </p>
            {privateChannels.map((c) => (
              <ChannelItem key={c.id} channel={c} />
            ))}
          </div>
        )}

        {dmChannels && dmChannels.length > 0 && (
          <div>
            <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Direct Messages
            </p>
            {dmChannels.map((c) => (
              <ChannelItem key={c.id} channel={c} />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

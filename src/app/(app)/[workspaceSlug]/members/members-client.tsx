"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Users, Loader2, UserMinus } from "lucide-react";
import { useUpdateMemberRole, useRemoveMember } from "@/hooks/use-members";
import { InviteModal } from "@/components/members/invite-modal";
import { PendingInvites } from "@/components/members/pending-invites";
import { toast } from "sonner";

interface MembersClientProps {
  workspaceId: string;
  currentMemberId: string;
  permissions: Record<string, boolean>;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function MembersClient({
  workspaceId,
  currentMemberId,
  permissions,
}: MembersClientProps) {
  const supabase = createClient();
  const [search, setSearch] = useState("");

  const { data: members, isLoading } = useQuery({
    queryKey: ["members", workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workspace_members")
        .select(
          "id, display_name, user_id, status, joined_at, role:roles(id, name, color)"
        )
        .eq("workspace_id", workspaceId)
        .eq("status", "active")
        .order("display_name");

      if (error) throw error;

      // workspace_members.display_name is often null — resolve from profiles
      const userIds = data.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);

      return data.map((m) => ({
        ...m,
        resolvedName:
          m.display_name || profileMap.get(m.user_id)?.display_name || null,
        avatarUrl: profileMap.get(m.user_id)?.avatar_url || null,
      }));
    },
  });

  // Fetch available roles for role changes and invite modal
  const { data: roles } = useQuery({
    queryKey: ["workspace-roles", workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roles")
        .select("id, name, color")
        .eq("workspace_id", workspaceId)
        .order("name");

      if (error) throw error;
      return data as { id: string; name: string; color: string }[];
    },
  });

  const updateMemberRole = useUpdateMemberRole(workspaceId);
  const removeMember = useRemoveMember(workspaceId);

  async function handleRoleChange(memberId: string, roleId: string) {
    try {
      await updateMemberRole.mutateAsync({ memberId, roleId });
      toast.success("Role updated.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update role."
      );
    }
  }

  async function handleRemoveMember(memberId: string, memberName: string) {
    try {
      await removeMember.mutateAsync(memberId);
      toast.success(`${memberName} has been removed.`);
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to remove member."
      );
    }
  }

  const filtered = members?.filter((m) =>
    (m.resolvedName ?? "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Members</h1>
          <p className="text-sm text-muted-foreground">
            People in this workspace
          </p>
        </div>
        {permissions["workspace.invite"] && roles && roles.length > 0 && (
          <InviteModal
            workspaceId={workspaceId}
            currentMemberId={currentMemberId}
            roles={roles}
          />
        )}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        {!isLoading && (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {filtered?.length ?? 0} member{(filtered?.length ?? 0) !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-lg border p-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered && filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((member) => {
            const role = member.role as { id: string; name: string; color: string } | null;
            const isCurrentUser = member.id === currentMemberId;
            return (
              <div
                key={member.id}
                className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <Avatar>
                  {member.avatarUrl && (
                    <AvatarImage src={member.avatarUrl} alt={member.resolvedName ?? ""} />
                  )}
                  <AvatarFallback>
                    {getInitials(member.resolvedName ?? "?")}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {member.resolvedName ?? "Unknown"}
                    {isCurrentUser && (
                      <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>
                    )}
                  </p>
                  {member.joined_at && (
                    <p className="text-xs text-muted-foreground">
                      Joined{" "}
                      {new Date(member.joined_at).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  )}
                </div>

                {/* Role display or role change dropdown */}
                {permissions["workspace.manage_roles"] && roles && !isCurrentUser ? (
                  <Select
                    value={role?.id ?? ""}
                    onValueChange={(v) => {
                      if (v) handleRoleChange(member.id, v);
                    }}
                  >
                    <SelectTrigger size="sm">
                      <span className="flex items-center gap-1.5">
                        {role && (
                          <span
                            className="inline-block h-2 w-2 rounded-full shrink-0"
                            style={{ backgroundColor: role.color }}
                          />
                        )}
                        {role?.name ?? "Select role"}
                      </span>
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r.id} value={r.id}>
                          <span
                            className="mr-1.5 inline-block h-2 w-2 rounded-full"
                            style={{ backgroundColor: r.color }}
                          />
                          {r.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : role ? (
                  <Badge
                    variant="outline"
                    style={
                      role.color
                        ? {
                            borderColor: role.color,
                            color: role.color,
                          }
                        : undefined
                    }
                  >
                    {role.name}
                  </Badge>
                ) : null}

                {/* Remove member button */}
                {permissions["workspace.remove_members"] && !isCurrentUser && (
                  <Button
                    variant="destructive"
                    size="icon-sm"
                    onClick={() =>
                      handleRemoveMember(
                        member.id,
                        member.resolvedName ?? "Member"
                      )
                    }
                    disabled={removeMember.isPending}
                  >
                    {removeMember.isPending ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <UserMinus className="h-3.5 w-3.5" />
                    )}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
            <Users className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">
            {search
              ? "No members match your search."
              : "No members yet. Invite people to your workspace to get started."}
          </p>
        </div>
      )}

      {/* Pending invites section */}
      {permissions["workspace.invite"] && (
        <PendingInvites
          workspaceId={workspaceId}
          currentMemberId={currentMemberId}
        />
      )}
    </div>
  );
}

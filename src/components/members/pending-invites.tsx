"use client";

import { useInvites, useRevokeInvite } from "@/hooks/use-workspace-invites";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, MailX, Ticket } from "lucide-react";
import { toast } from "sonner";

interface PendingInvitesProps {
  workspaceId: string;
  currentMemberId: string;
}

export function PendingInvites({
  workspaceId,
}: PendingInvitesProps) {
  const { data: invites, isLoading } = useInvites(workspaceId);
  const revokeInvite = useRevokeInvite(workspaceId);

  async function handleRevoke(inviteId: string) {
    try {
      await revokeInvite.mutateAsync(inviteId);
      toast.success("Invite revoked.");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to revoke invite."
      );
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Pending Invites</h2>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 rounded-lg border p-4">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>
    );
  }

  const pendingInvites = invites?.filter(
    (inv) => inv.expires_at && new Date(inv.expires_at) > new Date()
  );

  return (
    <div className="space-y-3">
      <h2 className="text-lg font-semibold">Pending Invites</h2>

      {!pendingInvites || pendingInvites.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-muted mb-2">
            <Ticket className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">
            No pending invites.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {pendingInvites.map((invite) => {
            const role = invite.role as { name: string; color: string } | null;
            const inviter = invite.inviter as
              | { display_name: string | null }
              | null;

            return (
              <div
                key={invite.id}
                className="flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">
                      {invite.invite_code}
                    </code>
                    {role && (
                      <Badge
                        variant="outline"
                        style={
                          role.color
                            ? { borderColor: role.color, color: role.color }
                            : undefined
                        }
                      >
                        {role.name}
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {invite.email && (
                      <span className="flex items-center gap-1">
                        <MailX className="h-3 w-3" />
                        {invite.email}
                      </span>
                    )}
                    {inviter?.display_name && (
                      <span>Invited by {inviter.display_name}</span>
                    )}
                    {invite.expires_at && (
                    <span>
                      Expires{" "}
                      {new Date(invite.expires_at).toLocaleDateString(
                        undefined,
                        { month: "short", day: "numeric", year: "numeric" }
                      )}
                    </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleRevoke(invite.id)}
                  disabled={revokeInvite.isPending}
                >
                  {revokeInvite.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    "Revoke"
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

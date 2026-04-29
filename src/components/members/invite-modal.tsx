"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateInvite } from "@/hooks/use-workspace-invites";
import { Copy, Link2, Loader2, Mail, UserPlus } from "lucide-react";
import { toast } from "sonner";

interface InviteModalProps {
  workspaceId: string;
  currentMemberId: string;
  roles: { id: string; name: string; color: string }[];
}

export function InviteModal({
  workspaceId,
  currentMemberId,
  roles,
}: InviteModalProps) {
  const [open, setOpen] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState(roles[0]?.id ?? "");
  const [email, setEmail] = useState("");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const createInvite = useCreateInvite(workspaceId);

  function resetForm() {
    setSelectedRoleId(roles[0]?.id ?? "");
    setEmail("");
    setGeneratedLink(null);
  }

  async function handleGenerateLink() {
    if (!selectedRoleId) {
      toast.error("Please select a role first.");
      return;
    }

    try {
      const invite = await createInvite.mutateAsync({
        role_id: selectedRoleId,
        invited_by: currentMemberId,
        email: email.trim() || undefined,
      });

      const link = `${window.location.origin}/invite/${invite.invite_code}`;
      setGeneratedLink(link);
      toast.success("Invite link generated!");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create invite."
      );
    }
  }

  async function handleCopyLink() {
    if (!generatedLink) return;
    try {
      await navigator.clipboard.writeText(generatedLink);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link.");
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        setOpen(nextOpen);
        if (!nextOpen) resetForm();
      }}
    >
      <DialogTrigger render={<Button />}>
        <UserPlus className="h-4 w-4" />
        Invite Members
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Members</DialogTitle>
          <DialogDescription>
            Generate an invite link to share with your team.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Role selection */}
          <div className="space-y-2">
            <Label htmlFor="invite-role">Role</Label>
            <Select
              value={selectedRoleId}
              onValueChange={(v) => v && setSelectedRoleId(v)}
            >
              <SelectTrigger className="w-full">
                {(() => {
                  const r = roles.find((r) => r.id === selectedRoleId);
                  return r ? (
                    <span className="flex items-center gap-1.5">
                      <span className="inline-block h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: r.color }} />
                      {r.name}
                    </span>
                  ) : "Select a role";
                })()}
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.id}>
                    <span
                      className="mr-1.5 inline-block h-2 w-2 rounded-full"
                      style={{ backgroundColor: role.color }}
                    />
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Optional email */}
          <div className="space-y-2">
            <Label htmlFor="invite-email">
              <Mail className="h-3.5 w-3.5" />
              Email (optional)
            </Label>
            <Input
              id="invite-email"
              type="email"
              placeholder="colleague@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          {/* Generate link button */}
          {!generatedLink ? (
            <Button
              className="w-full"
              onClick={handleGenerateLink}
              disabled={createInvite.isPending || !selectedRoleId}
            >
              {createInvite.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Link2 className="mr-2 h-4 w-4" />
              )}
              Generate Invite Link
            </Button>
          ) : (
            <div className="space-y-2">
              <Label>Invite Link</Label>
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={generatedLink}
                  className="flex-1 text-xs"
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyLink}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setGeneratedLink(null)}
              >
                Generate Another Link
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

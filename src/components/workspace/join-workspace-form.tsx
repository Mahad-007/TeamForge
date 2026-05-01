"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

export function JoinWorkspaceForm() {
  const router = useRouter();
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    // Look up invite
    const { data: invite, error: inviteError } = await supabase
      .from("workspace_invites")
      .select("*, workspace:workspaces(slug)")
      .eq("invite_code", inviteCode.trim())
      .single();

    if (inviteError || !invite) {
      setError("Invalid invite code");
      setLoading(false);
      return;
    }

    // Check expiry
    if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
      setError("This invite has expired");
      setLoading(false);
      return;
    }

    // Check max uses
    if (invite.max_uses && (invite.use_count ?? 0) >= invite.max_uses) {
      setError("This invite has reached its maximum uses");
      setLoading(false);
      return;
    }

    // Add member
    const { error: memberError } = await supabase
      .from("workspace_members")
      .insert({
        workspace_id: invite.workspace_id,
        user_id: user.id,
        role_id: invite.role_id,
      });

    if (memberError) {
      if (memberError.code === "23505") {
        setError("You are already a member of this workspace");
      } else {
        setError(memberError.message);
      }
      setLoading(false);
      return;
    }

    // Increment use count
    await supabase
      .from("workspace_invites")
      .update({ use_count: (invite.use_count ?? 0) + 1 })
      .eq("id", invite.id);

    const workspace = invite.workspace as unknown as { slug: string };
    // Use full-page navigation to ensure server components pick up the new membership
    window.location.href = `/${workspace.slug}/dashboard`;
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="invite-code">Invite code</Label>
        <Input
          id="invite-code"
          type="text"
          placeholder="Paste your invite code"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          required
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button
        type="submit"
        className="w-full"
        disabled={loading || !inviteCode.trim()}
      >
        {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Join workspace
      </Button>
    </form>
  );
}

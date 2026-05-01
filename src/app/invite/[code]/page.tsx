import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";

export const metadata = { title: "Join Workspace - TeamForge" };

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    // Not logged in — redirect to signup with the invite code preserved
    redirect(`/signup?invite=${encodeURIComponent(code)}`);
  }

  // User is logged in — look up the invite and try to join
  const { data: invite, error: inviteError } = await supabase
    .from("workspace_invites")
    .select("*, workspace:workspaces(slug)")
    .eq("invite_code", code.trim())
    .single();

  if (inviteError || !invite) {
    redirect("/onboarding?error=invalid_invite");
  }

  // Check expiry
  if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
    redirect("/onboarding?error=invite_expired");
  }

  // Check max uses
  if (invite.max_uses && (invite.use_count ?? 0) >= invite.max_uses) {
    redirect("/onboarding?error=invite_maxed");
  }

  // Check if already a member
  const { data: existingMember } = await supabase
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", invite.workspace_id)
    .eq("user_id", user.id)
    .maybeSingle();

  const workspace = invite.workspace as unknown as { slug: string };

  if (existingMember) {
    // Already a member — just redirect to the workspace
    redirect(`/${workspace.slug}/dashboard`);
  }

  // Add the user as a member
  const { error: memberError } = await supabase
    .from("workspace_members")
    .insert({
      workspace_id: invite.workspace_id,
      user_id: user.id,
      role_id: invite.role_id,
    });

  if (memberError) {
    redirect("/onboarding?error=join_failed");
  }

  // Increment use count
  await supabase
    .from("workspace_invites")
    .update({ use_count: (invite.use_count ?? 0) + 1 })
    .eq("id", invite.id);

  // Redirect to the workspace
  redirect(`/${workspace.slug}/dashboard`);
}

import { redirect, notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getAuthUser,
  getWorkspaceBySlug,
  getWorkspaceMember,
} from "@/lib/supabase/cached-queries";
import { AppShell } from "./app-shell";

export default async function WorkspaceLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;

  const user = await getAuthUser();
  if (!user) redirect("/login");

  // Fetch workspace (cached — shared with child pages)
  const workspace = await getWorkspaceBySlug(workspaceSlug);
  if (!workspace) notFound();

  // Verify membership (cached — shared with child pages)
  const membership = await getWorkspaceMember(workspace.id, user.id);
  if (!membership) notFound();

  // Fetch profile
  const supabase = await createServerSupabaseClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .maybeSingle();

  return (
    <AppShell
      workspaceSlug={workspaceSlug}
      workspaceName={workspace.name}
      workspaceId={workspace.id}
      userDisplayName={profile?.display_name ?? user.email?.split("@")[0] ?? "User"}
      userAvatarUrl={profile?.avatar_url ?? null}
      userEmail={user.email ?? ""}
    >
      {children}
    </AppShell>
  );
}

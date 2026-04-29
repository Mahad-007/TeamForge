import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AiSettingsClient } from "./ai-settings-client";

export const metadata = { title: "AI Settings - TeamForge" };

export default async function AiSettingsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("*")
    .eq("slug", workspaceSlug)
    .single();
  if (!workspace) redirect("/onboarding");

  const { data: member } = await supabase
    .from("workspace_members")
    .select("id, user_id, role:roles(*)")
    .eq("workspace_id", workspace.id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  return (
    <AiSettingsClient
      workspaceId={workspace.id}
      workspaceSlug={workspaceSlug}
      workspaceSettings={workspace.settings as Record<string, unknown> | null}
      memberId={member?.id ?? null}
    />
  );
}

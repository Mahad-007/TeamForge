import { createServerSupabaseClient } from "@/lib/supabase/server";
import { DashboardClient } from "./dashboard-client";

export const metadata = { title: "Dashboard - TeamForge" };

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user!.id)
    .single();

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("slug", workspaceSlug)
    .single();

  const { data: member } = await supabase
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", workspace!.id)
    .eq("user_id", user!.id)
    .single();

  return (
    <DashboardClient
      displayName={profile?.display_name ?? "there"}
      workspaceId={workspace!.id}
      memberId={member!.id}
    />
  );
}

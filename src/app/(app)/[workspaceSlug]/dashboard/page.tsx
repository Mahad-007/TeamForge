import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getAuthUser,
  getWorkspaceBySlug,
  getWorkspaceMember,
} from "@/lib/supabase/cached-queries";
import { DashboardClient } from "./dashboard-client";

export const metadata = { title: "Dashboard - TeamForge" };

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;

  const user = await getAuthUser();
  const workspace = await getWorkspaceBySlug(workspaceSlug);
  const member = await getWorkspaceMember(workspace!.id, user!.id);

  const supabase = await createServerSupabaseClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user!.id)
    .maybeSingle();

  return (
    <DashboardClient
      displayName={profile?.display_name ?? "there"}
      workspaceId={workspace!.id}
      memberId={member!.id}
    />
  );
}

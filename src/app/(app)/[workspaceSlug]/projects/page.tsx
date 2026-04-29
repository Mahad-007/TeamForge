import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProjectsClient } from "./projects-client";

export const metadata = { title: "Projects - TeamForge" };

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

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
    <ProjectsClient
      workspaceId={workspace!.id}
      workspaceSlug={workspaceSlug}
      currentMemberId={member!.id}
    />
  );
}

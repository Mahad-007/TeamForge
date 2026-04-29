import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { BugsClient } from "./bugs-client";

export const metadata = { title: "Bugs - TeamForge" };

export default async function BugsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; projectSlug: string }>;
}) {
  const { workspaceSlug, projectSlug } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("slug", workspaceSlug)
    .maybeSingle();
  if (!workspace) redirect("/onboarding");

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, slug")
    .eq("workspace_id", workspace.id)
    .eq("slug", projectSlug)
    .maybeSingle();
  if (!project) redirect(`/${workspaceSlug}/projects`);

  const { data: member } = await supabase
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", workspace.id)
    .eq("user_id", user.id)
    .maybeSingle();

  return (
    <BugsClient
      projectId={project.id}
      projectName={project.name}
      projectSlug={project.slug}
      workspaceSlug={workspaceSlug}
      workspaceId={workspace.id}
      currentMemberId={member!.id}
    />
  );
}

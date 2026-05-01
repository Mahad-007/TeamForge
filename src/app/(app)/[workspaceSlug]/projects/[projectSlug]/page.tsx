import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getAuthUser,
  getWorkspaceBySlug,
  getWorkspaceMember,
} from "@/lib/supabase/cached-queries";
import { ProjectDetailClient } from "./project-detail-client";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ workspaceSlug: string; projectSlug: string }>;
}) {
  const { projectSlug } = await params;
  return { title: `${projectSlug} - TeamForge` };
}

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; projectSlug: string }>;
}) {
  const { workspaceSlug, projectSlug } = await params;

  const user = await getAuthUser();
  if (!user) redirect("/login");

  const workspace = await getWorkspaceBySlug(workspaceSlug);
  if (!workspace) redirect("/onboarding");

  const supabase = await createServerSupabaseClient();
  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("workspace_id", workspace.id)
    .eq("slug", projectSlug)
    .maybeSingle();
  if (!project) redirect(`/${workspaceSlug}/projects`);

  const member = await getWorkspaceMember(workspace.id, user.id);

  return (
    <ProjectDetailClient
      project={project}
      workspaceSlug={workspaceSlug}
      workspaceId={workspace.id}
      currentMemberId={member!.id}
    />
  );
}

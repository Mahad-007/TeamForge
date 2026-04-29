import { redirect, notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
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
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("slug", workspaceSlug)
    .single();
  if (!workspace) notFound();

  const { data: project } = await supabase
    .from("projects")
    .select("*")
    .eq("workspace_id", workspace.id)
    .eq("slug", projectSlug)
    .single();
  if (!project) redirect(`/${workspaceSlug}/projects`);

  const { data: member } = await supabase
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", workspace.id)
    .eq("user_id", user.id)
    .single();

  return (
    <ProjectDetailClient
      project={project}
      workspaceSlug={workspaceSlug}
      workspaceId={workspace.id}
      currentMemberId={member!.id}
    />
  );
}

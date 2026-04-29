import { redirect, notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ProjectDocsClient } from "./project-docs-client";

export const metadata = { title: "Docs - TeamForge" };

export default async function ProjectDocsPage({
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
    .single();
  if (!workspace) notFound();

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, slug")
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
    <ProjectDocsClient
      workspaceId={workspace.id}
      workspaceSlug={workspaceSlug}
      projectId={project.id}
      projectName={project.name}
      projectSlug={project.slug}
      memberId={member!.id}
    />
  );
}

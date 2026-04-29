import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TimelinePageClient } from "./timeline-client";

export const metadata = { title: "Timeline - TeamForge" };

export default async function TimelinePage({
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
  if (!workspace) redirect("/onboarding");

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, slug")
    .eq("workspace_id", workspace.id)
    .eq("slug", projectSlug)
    .single();
  if (!project) redirect(`/${workspaceSlug}/projects`);

  return (
    <TimelinePageClient
      projectId={project.id}
      projectName={project.name}
      projectSlug={project.slug}
      workspaceSlug={workspaceSlug}
    />
  );
}

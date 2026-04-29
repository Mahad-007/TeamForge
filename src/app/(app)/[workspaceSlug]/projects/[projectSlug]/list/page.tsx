import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ListClient } from "./list-client";

export const metadata = { title: "Task List - TeamForge" };

export default async function ListPage({
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
  if (!workspace) redirect("/onboarding");

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, slug, settings")
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

  const settings = project.settings as { statuses?: string[] } | null;
  const statuses = settings?.statuses ?? ["Backlog", "Todo", "In Progress", "Review", "Done"];

  return (
    <ListClient
      projectId={project.id}
      projectName={project.name}
      projectSlug={project.slug}
      workspaceSlug={workspaceSlug}
      workspaceId={workspace.id}
      currentMemberId={member!.id}
      statuses={statuses}
    />
  );
}

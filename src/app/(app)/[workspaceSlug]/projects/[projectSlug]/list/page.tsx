import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getAuthUser,
  getWorkspaceBySlug,
  getWorkspaceMember,
} from "@/lib/supabase/cached-queries";
import { ListClient } from "./list-client";

export const metadata = { title: "Task List - TeamForge" };

export default async function ListPage({
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
    .select("id, name, slug, settings")
    .eq("workspace_id", workspace.id)
    .eq("slug", projectSlug)
    .maybeSingle();
  if (!project) redirect(`/${workspaceSlug}/projects`);

  const member = await getWorkspaceMember(workspace.id, user.id);

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

import { redirect, notFound } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { TaskDetailPage } from "./task-detail-page";

export const metadata = { title: "Task - TeamForge" };

export default async function TaskPage({
  params,
}: {
  params: Promise<{
    workspaceSlug: string;
    projectSlug: string;
    taskIdentifier: string;
  }>;
}) {
  const { workspaceSlug, projectSlug, taskIdentifier } = await params;
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
    .select("id, name, slug, settings")
    .eq("workspace_id", workspace.id)
    .eq("slug", projectSlug)
    .single();
  if (!project) redirect(`/${workspaceSlug}/projects`);

  const { data: task } = await supabase
    .from("tasks")
    .select(
      "*, assignee:workspace_members!tasks_assignee_id_fkey(id, display_name), reporter:workspace_members!tasks_reporter_id_fkey(id, display_name)"
    )
    .eq("project_id", project.id)
    .eq("identifier", taskIdentifier)
    .single();

  if (!task) redirect(`/${workspaceSlug}/projects/${projectSlug}/board`);

  const { data: member } = await supabase
    .from("workspace_members")
    .select("id")
    .eq("workspace_id", workspace.id)
    .eq("user_id", user.id)
    .single();

  const settings = project.settings as { statuses?: string[] } | null;
  const statuses = settings?.statuses ?? [
    "Backlog",
    "Todo",
    "In Progress",
    "Review",
    "Done",
  ];

  return (
    <TaskDetailPage
      task={task}
      projectId={project.id}
      projectName={project.name}
      projectSlug={project.slug}
      workspaceId={workspace.id}
      workspaceSlug={workspaceSlug}
      currentMemberId={member!.id}
      statuses={statuses}
    />
  );
}

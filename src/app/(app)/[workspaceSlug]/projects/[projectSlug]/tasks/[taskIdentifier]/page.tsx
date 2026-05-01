import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getAuthUser,
  getWorkspaceBySlug,
  getWorkspaceMember,
} from "@/lib/supabase/cached-queries";
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

  const { data: taskRaw } = await supabase
    .from("tasks")
    .select(
      "*, assignee:workspace_members!tasks_assignee_id_fkey(id, display_name, user_id), reporter:workspace_members!tasks_reporter_id_fkey(id, display_name, user_id)"
    )
    .eq("project_id", project.id)
    .eq("identifier", taskIdentifier)
    .maybeSingle();

  // Resolve display names from profiles where workspace_members.display_name is null
  let task = taskRaw;
  if (task) {
    const userIdsToResolve: string[] = [];
    const assignee = task.assignee as { id: string; user_id: string; display_name: string | null } | null;
    const reporter = task.reporter as { id: string; user_id: string; display_name: string | null } | null;
    if (assignee && !assignee.display_name) userIdsToResolve.push(assignee.user_id);
    if (reporter && !reporter.display_name) userIdsToResolve.push(reporter.user_id);

    if (userIdsToResolve.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", [...new Set(userIdsToResolve)]);
      const profileMap = new Map(profiles?.map((p) => [p.id, p.display_name]) ?? []);

      task = {
        ...task,
        assignee: assignee ? { ...assignee, display_name: assignee.display_name ?? profileMap.get(assignee.user_id) ?? null } : null,
        reporter: reporter ? { ...reporter, display_name: reporter.display_name ?? profileMap.get(reporter.user_id) ?? null } : null,
      } as typeof task;
    }
  }

  if (!task) redirect(`/${workspaceSlug}/projects/${projectSlug}/board`);

  const member = await getWorkspaceMember(workspace.id, user.id);

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

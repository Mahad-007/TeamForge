import {
  getAuthUser,
  getWorkspaceBySlug,
  getWorkspaceMember,
} from "@/lib/supabase/cached-queries";
import { ProjectsClient } from "./projects-client";

export const metadata = { title: "Projects - TeamForge" };

export default async function ProjectsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;

  const user = await getAuthUser();
  const workspace = await getWorkspaceBySlug(workspaceSlug);
  const member = await getWorkspaceMember(workspace!.id, user!.id);

  return (
    <ProjectsClient
      workspaceId={workspace!.id}
      workspaceSlug={workspaceSlug}
      currentMemberId={member!.id}
    />
  );
}

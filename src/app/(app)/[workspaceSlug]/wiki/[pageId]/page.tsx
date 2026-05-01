import { redirect } from "next/navigation";
import {
  getAuthUser,
  getWorkspaceBySlug,
  getWorkspaceMember,
} from "@/lib/supabase/cached-queries";
import { WikiPageView } from "./wiki-page-view";

export const metadata = { title: "Wiki - TeamForge" };

export default async function WikiPagePage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; pageId: string }>;
}) {
  const { workspaceSlug, pageId } = await params;

  const user = await getAuthUser();
  if (!user) redirect("/login");

  const workspace = await getWorkspaceBySlug(workspaceSlug);
  if (!workspace) redirect("/onboarding");

  const member = await getWorkspaceMember(workspace.id, user.id);
  if (!member) redirect("/onboarding");

  return (
    <WikiPageView
      pageId={pageId}
      memberId={member.id}
      workspaceId={workspace.id}
    />
  );
}

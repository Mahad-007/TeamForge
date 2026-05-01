import { redirect } from "next/navigation";
import {
  getAuthUser,
  getWorkspaceBySlug,
  getWorkspaceMember,
} from "@/lib/supabase/cached-queries";
import { WikiLayoutClient } from "./wiki-layout-client";

export default async function WikiLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;

  const user = await getAuthUser();
  if (!user) redirect("/login");

  const workspace = await getWorkspaceBySlug(workspaceSlug);
  if (!workspace) redirect("/onboarding");

  const member = await getWorkspaceMember(workspace.id, user.id);
  if (!member) redirect("/onboarding");

  return (
    <WikiLayoutClient
      workspaceId={workspace.id}
      workspaceSlug={workspaceSlug}
      memberId={member.id}
    >
      {children}
    </WikiLayoutClient>
  );
}

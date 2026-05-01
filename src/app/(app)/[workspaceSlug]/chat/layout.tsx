import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getAuthUser,
  getWorkspaceBySlug,
} from "@/lib/supabase/cached-queries";
import { ChatLayoutClient } from "./chat-layout-client";

export default async function ChatLayout({
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

  const supabase = await createServerSupabaseClient();
  const { data: member } = await supabase
    .from("workspace_members")
    .select("id, display_name")
    .eq("workspace_id", workspace.id)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!member) redirect("/onboarding");

  return (
    <ChatLayoutClient
      workspaceId={workspace.id}
      workspaceSlug={workspaceSlug}
      currentMemberId={member.id}
      currentMemberName={member.display_name ?? user.email?.split("@")[0] ?? "User"}
    >
      {children}
    </ChatLayoutClient>
  );
}

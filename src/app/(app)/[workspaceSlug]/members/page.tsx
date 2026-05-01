import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getAuthUser,
  getWorkspaceBySlug,
} from "@/lib/supabase/cached-queries";
import { MembersClient } from "./members-client";

export const metadata = { title: "Members - TeamForge" };

export default async function MembersPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;

  const user = await getAuthUser();
  const workspace = await getWorkspaceBySlug(workspaceSlug);

  // Need role permissions, so can't use the basic cached member query
  const supabase = await createServerSupabaseClient();
  const { data: currentMember } = await supabase
    .from("workspace_members")
    .select("id, role:roles(permissions)")
    .eq("workspace_id", workspace!.id)
    .eq("user_id", user!.id)
    .maybeSingle();

  return (
    <MembersClient
      workspaceId={workspace!.id}
      currentMemberId={currentMember!.id}
      permissions={(currentMember?.role as any)?.permissions ?? {}}
    />
  );
}

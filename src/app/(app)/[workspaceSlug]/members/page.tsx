import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MembersClient } from "./members-client";

export const metadata = { title: "Members - TeamForge" };

export default async function MembersPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("slug", workspaceSlug)
    .single();

  const { data: currentMember } = await supabase
    .from("workspace_members")
    .select("id, role:roles(permissions)")
    .eq("workspace_id", workspace!.id)
    .eq("user_id", user!.id)
    .single();

  return (
    <MembersClient
      workspaceId={workspace!.id}
      currentMemberId={currentMember!.id}
      permissions={(currentMember?.role as any)?.permissions ?? {}}
    />
  );
}

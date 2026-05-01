import { createServerSupabaseClient } from "@/lib/supabase/server";
import {
  getAuthUser,
  getWorkspaceBySlug,
} from "@/lib/supabase/cached-queries";
import { RolesClient } from "./roles-client";

export const metadata = { title: "Roles - TeamForge" };

export default async function RolesPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;

  const user = await getAuthUser();
  const workspace = await getWorkspaceBySlug(workspaceSlug);

  const supabase = await createServerSupabaseClient();
  const { data: currentMember } = await supabase
    .from("workspace_members")
    .select("id, role:roles(permissions)")
    .eq("workspace_id", workspace!.id)
    .eq("user_id", user!.id)
    .maybeSingle();

  return (
    <RolesClient
      workspaceId={workspace!.id}
      permissions={(currentMember?.role as any)?.permissions ?? {}}
    />
  );
}

import { createServerSupabaseClient } from "@/lib/supabase/server";
import { RolesClient } from "./roles-client";

export const metadata = { title: "Roles - TeamForge" };

export default async function RolesPage({
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
    <RolesClient
      workspaceId={workspace!.id}
      permissions={(currentMember?.role as any)?.permissions ?? {}}
    />
  );
}

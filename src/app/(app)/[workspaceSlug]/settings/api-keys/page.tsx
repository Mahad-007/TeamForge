import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ApiKeysClient } from "./api-keys-client";

export const metadata = { title: "API Keys - TeamForge" };

export default async function ApiKeysPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("*")
    .eq("slug", workspaceSlug)
    .maybeSingle();
  if (!workspace) redirect("/onboarding");

  const { data: member } = await supabase
    .from("workspace_members")
    .select("id, user_id, role:roles(*)")
    .eq("workspace_id", workspace.id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .maybeSingle();

  return (
    <ApiKeysClient
      workspaceId={workspace.id}
      workspaceSlug={workspaceSlug}
      memberId={member?.id ?? ""}
    />
  );
}

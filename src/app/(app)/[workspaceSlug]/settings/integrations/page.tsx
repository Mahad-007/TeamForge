import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { IntegrationsClient } from "./integrations-client";

export const metadata = { title: "Integrations - TeamForge" };

export default async function IntegrationsPage({
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
    .single();
  if (!workspace) notFound();

  const { data: member } = await supabase
    .from("workspace_members")
    .select("id, user_id, role:roles(*)")
    .eq("workspace_id", workspace.id)
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  return (
    <IntegrationsClient
      workspaceId={workspace.id}
      workspaceSlug={workspaceSlug}
      workspaceSettings={workspace.settings as Record<string, unknown> | null}
      memberId={member?.id ?? ""}
    />
  );
}

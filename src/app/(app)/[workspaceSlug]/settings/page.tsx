import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SettingsClient } from "./settings-client";

export const metadata = { title: "Settings - TeamForge" };

export default async function SettingsPage({
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
  if (!workspace) redirect("/onboarding");

  const isOwner = workspace.owner_id === user.id;

  return (
    <SettingsClient
      workspace={workspace}
      workspaceSlug={workspaceSlug}
      isOwner={isOwner}
    />
  );
}

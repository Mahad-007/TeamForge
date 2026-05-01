import { redirect } from "next/navigation";
import {
  getAuthUser,
  getWorkspaceBySlug,
} from "@/lib/supabase/cached-queries";
import { SettingsClient } from "./settings-client";

export const metadata = { title: "Settings - TeamForge" };

export default async function SettingsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;

  const user = await getAuthUser();
  if (!user) redirect("/login");

  const workspace = await getWorkspaceBySlug(workspaceSlug);
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

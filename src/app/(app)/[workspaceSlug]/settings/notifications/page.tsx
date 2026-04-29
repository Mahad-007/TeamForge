import { createServerSupabaseClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { NotificationsClient } from "./notifications-client";

export const metadata = { title: "Notification Preferences - TeamForge" };

export default async function NotificationsPage({
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

  return (
    <NotificationsClient
      userId={user.id}
      workspaceId={workspace.id}
      workspaceSlug={workspaceSlug}
    />
  );
}

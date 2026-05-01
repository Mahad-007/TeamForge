import { redirect } from "next/navigation";
import {
  getAuthUser,
  getWorkspaceBySlug,
} from "@/lib/supabase/cached-queries";
import { AnalyticsClient } from "./analytics-client";

export const metadata = { title: "Analytics - TeamForge" };

export default async function AnalyticsPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string }>;
}) {
  const { workspaceSlug } = await params;

  const user = await getAuthUser();
  if (!user) redirect("/login");

  const workspace = await getWorkspaceBySlug(workspaceSlug);
  if (!workspace) redirect("/onboarding");

  return <AnalyticsClient workspaceId={workspace.id} />;
}

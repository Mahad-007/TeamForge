import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { CalendarPageClient } from "./calendar-client";

export const metadata = { title: "Calendar - TeamForge" };

export default async function CalendarPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; projectSlug: string }>;
}) {
  const { workspaceSlug, projectSlug } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("slug", workspaceSlug)
    .maybeSingle();
  if (!workspace) redirect("/onboarding");

  const { data: project } = await supabase
    .from("projects")
    .select("id, name, slug")
    .eq("workspace_id", workspace.id)
    .eq("slug", projectSlug)
    .maybeSingle();
  if (!project) redirect(`/${workspaceSlug}/projects`);

  return (
    <CalendarPageClient
      projectId={project.id}
      projectName={project.name}
      projectSlug={project.slug}
      workspaceSlug={workspaceSlug}
    />
  );
}

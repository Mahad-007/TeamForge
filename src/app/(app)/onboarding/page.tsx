import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { OnboardingClient } from "./onboarding-client";

export const metadata = { title: "Get Started - TeamForge" };

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ new?: string }>;
}) {
  const { new: isNew } = await searchParams;
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // If the user explicitly wants to create/join a new workspace, skip redirect
  if (isNew !== "true") {
    // Check if user already has a workspace
    const { data: memberships } = await supabase
      .from("workspace_members")
      .select("workspace:workspaces(slug)")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1);

    if (memberships && memberships.length > 0) {
      const workspace = memberships[0].workspace as unknown as { slug: string };
      redirect(`/${workspace.slug}/dashboard`);
    }
  }

  return <OnboardingClient />;
}

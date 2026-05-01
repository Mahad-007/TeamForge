import { cache } from "react";
import { createServerSupabaseClient } from "./server";

/**
 * Cached server-side queries that are deduplicated within a single
 * React Server Component render pass. This prevents redundant database
 * queries when the same data is needed by both layout and page components.
 */

export const getAuthUser = cache(async () => {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
});

export const getWorkspaceBySlug = cache(async (slug: string) => {
  const supabase = await createServerSupabaseClient();
  const { data } = await supabase
    .from("workspaces")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data;
});

export const getWorkspaceMember = cache(
  async (workspaceId: string, userId: string) => {
    const supabase = await createServerSupabaseClient();
    const { data } = await supabase
      .from("workspace_members")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("user_id", userId)
      .eq("status", "active")
      .maybeSingle();
    return data;
  }
);

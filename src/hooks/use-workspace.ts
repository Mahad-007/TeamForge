"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useWorkspaces() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["workspaces"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("workspace_members")
        .select("*, workspace:workspaces(*)")
        .eq("user_id", user.id)
        .eq("status", "active");

      if (error) throw error;
      return data;
    },
  });
}

export function useWorkspace(slug: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["workspace", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workspaces")
        .select("*")
        .eq("slug", slug)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!slug,
  });
}

export function useCurrentMember(workspaceId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["current-member", workspaceId],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("workspace_members")
        .select("*, role:roles(*)")
        .eq("workspace_id", workspaceId)
        .eq("user_id", user.id)
        .eq("status", "active")
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });
}

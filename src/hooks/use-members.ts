"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useWorkspaceMembersWithProfiles(workspaceId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["workspace-members-full", workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workspace_members")
        .select(
          "id, display_name, user_id, status, joined_at, role:roles(id, name, color)"
        )
        .eq("workspace_id", workspaceId)
        .eq("status", "active")
        .order("joined_at", { ascending: true });

      if (error) throw error;

      // workspace_members.display_name is often null — resolve from profiles
      const userIds = data.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, display_name, avatar_url")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? []);

      return data.map((m) => ({
        ...m,
        display_name:
          m.display_name || profileMap.get(m.user_id)?.display_name || null,
        avatar_url: profileMap.get(m.user_id)?.avatar_url || null,
      }));
    },
    enabled: !!workspaceId,
  });
}

export function useUpdateMemberRole(workspaceId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      roleId,
    }: {
      memberId: string;
      roleId: string;
    }) => {
      const { error } = await supabase
        .from("workspace_members")
        .update({ role_id: roleId })
        .eq("id", memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["workspace-members-full", workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["members", workspaceId],
      });
    },
  });
}

export function useRemoveMember(workspaceId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("workspace_members")
        .update({ status: "deactivated" })
        .eq("id", memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["workspace-members-full", workspaceId],
      });
      queryClient.invalidateQueries({
        queryKey: ["members", workspaceId],
      });
    },
  });
}

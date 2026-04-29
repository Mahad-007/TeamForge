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
          "id, display_name, user_id, status, joined_at, role:roles(id, name, color), profile:profiles(display_name, avatar_url)"
        )
        .eq("workspace_id", workspaceId)
        .eq("status", "active")
        .order("joined_at", { ascending: true });

      if (error) throw error;
      return data;
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

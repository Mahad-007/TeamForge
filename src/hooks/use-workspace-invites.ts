"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useInvites(workspaceId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["workspace-invites", workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workspace_invites")
        .select(
          "*, role:roles(name, color), inviter:workspace_members!workspace_invites_invited_by_fkey(display_name)"
        )
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });
}

export function useCreateInvite(workspaceId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invite: {
      email?: string;
      role_id: string;
      invited_by: string;
      expires_at?: string | null;
      max_uses?: number | null;
    }) => {
      const inviteCode =
        Math.random().toString(36).substring(2, 8).toUpperCase() +
        Math.random().toString(36).substring(2, 8).toUpperCase();

      const { data, error } = await supabase
        .from("workspace_invites")
        .insert({
          ...invite,
          workspace_id: workspaceId,
          invite_code: inviteCode,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["workspace-invites", workspaceId],
      });
    },
  });
}

export function useRevokeInvite(workspaceId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from("workspace_invites")
        .delete()
        .eq("id", inviteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["workspace-invites", workspaceId],
      });
    },
  });
}

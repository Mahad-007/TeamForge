"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useUpdateRole(workspaceId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roleId,
      ...updates
    }: {
      roleId: string;
      name?: string;
      color?: string;
      permissions?: Record<string, boolean>;
    }) => {
      const { error } = await supabase
        .from("roles")
        .update(updates)
        .eq("id", roleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles", workspaceId] });
      queryClient.invalidateQueries({ queryKey: ["current-member", workspaceId] });
    },
  });
}

export function useCreateRole(workspaceId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (role: {
      name: string;
      color?: string;
      permissions: Record<string, boolean>;
      position?: number;
    }) => {
      const { data, error } = await supabase
        .from("roles")
        .insert({
          ...role,
          workspace_id: workspaceId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles", workspaceId] });
    },
  });
}

export function useDeleteRole(workspaceId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (roleId: string) => {
      const { error } = await supabase
        .from("roles")
        .delete()
        .eq("id", roleId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["roles", workspaceId] });
    },
  });
}

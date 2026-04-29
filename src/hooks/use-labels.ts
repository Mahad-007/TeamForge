"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useLabels(workspaceId: string, projectId?: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["labels", workspaceId, projectId],
    queryFn: async () => {
      let query = supabase
        .from("labels")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("name", { ascending: true });

      if (projectId) {
        query = query.eq("project_id", projectId);
      } else {
        query = query.is("project_id", null);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });
}

export function useCreateLabel(workspaceId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (label: {
      name: string;
      color: string;
      project_id?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("labels")
        .insert({
          ...label,
          workspace_id: workspaceId,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["labels", workspaceId, data.project_id],
      });
    },
  });
}

export function useDeleteLabel(workspaceId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      projectId,
    }: {
      id: string;
      projectId?: string | null;
    }) => {
      const { error } = await supabase.from("labels").delete().eq("id", id);
      if (error) throw error;
      return { projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["labels", workspaceId, data.projectId],
      });
    },
  });
}

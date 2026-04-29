"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import type { Json } from "@/types/database";

export function useSavedViews(projectId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["saved-views", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("saved_views")
        .select(
          "*, creator:workspace_members!saved_views_created_by_fkey(display_name)"
        )
        .eq("project_id", projectId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

export function useCreateView(projectId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (view: {
      name: string;
      type: string;
      filters: Json;
      sort?: Json;
      is_shared?: boolean;
      workspace_id: string;
      created_by: string;
    }) => {
      const { data, error } = await supabase
        .from("saved_views")
        .insert({ ...view, project_id: projectId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["saved-views", projectId],
      });
    },
  });
}

export function useDeleteView(projectId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (viewId: string) => {
      const { error } = await supabase
        .from("saved_views")
        .delete()
        .eq("id", viewId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["saved-views", projectId],
      });
    },
  });
}

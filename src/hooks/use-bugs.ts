"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useBugs(projectId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["bugs", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bugs")
        .select("*, assignee:workspace_members!bugs_assignee_id_fkey(id, display_name)")
        .eq("project_id", projectId)
        .order("severity", { ascending: true })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

export function useCreateBug(projectId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (bug: {
      title: string;
      description?: string;
      severity?: string;
      priority?: string;
      assignee_id?: string | null;
      environment?: string;
      related_task_id?: string | null;
      workspace_id: string;
      reporter_id: string;
    }) => {
      const { data, error } = await supabase
        .from("bugs")
        .insert({ ...bug, project_id: projectId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bugs", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-stats", projectId] });
    },
  });
}

export function useDeleteBug() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase.from("bugs").delete().eq("id", id);
      if (error) throw error;
      return { projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bugs", data.projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-stats", data.projectId] });
    },
  });
}

export function useUpdateBug() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      title?: string;
      description?: string;
      status?: string;
      severity?: string;
      priority?: string;
      assignee_id?: string | null;
      environment?: string;
      resolved_at?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("bugs")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["bugs", data.project_id] });
      queryClient.invalidateQueries({ queryKey: ["project-stats", data.project_id] });
    },
  });
}

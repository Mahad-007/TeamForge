"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useTasks(projectId: string, filters?: { status?: string; assignee_id?: string; priority?: string }) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["tasks", projectId, filters],
    queryFn: async () => {
      let query = supabase
        .from("tasks")
        .select(
          "*, assignee:workspace_members!tasks_assignee_id_fkey(id, display_name, user_id)"
        )
        .eq("project_id", projectId)
        .is("parent_task_id", null)
        .order("sort_order", { ascending: true });

      if (filters?.status) query = query.eq("status", filters.status);
      if (filters?.assignee_id) query = query.eq("assignee_id", filters.assignee_id);
      if (filters?.priority) query = query.eq("priority", filters.priority);

      const { data, error } = await query;
      if (error) throw error;

      // Resolve display names from profiles where workspace_members.display_name is null
      const assigneeUserIds = data
        .map((t) => (t.assignee as { id: string; user_id: string; display_name: string | null } | null))
        .filter((a): a is { id: string; user_id: string; display_name: string | null } => !!a && !a.display_name)
        .map((a) => a.user_id);

      if (assigneeUserIds.length > 0) {
        const uniqueIds = [...new Set(assigneeUserIds)];
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", uniqueIds);
        const profileMap = new Map(profiles?.map((p) => [p.id, p.display_name]) ?? []);

        return data.map((t) => {
          const assignee = t.assignee as { id: string; user_id: string; display_name: string | null } | null;
          if (assignee && !assignee.display_name) {
            return {
              ...t,
              assignee: { ...assignee, display_name: profileMap.get(assignee.user_id) ?? null },
            };
          }
          return t;
        });
      }

      return data;
    },
    enabled: !!projectId,
  });
}

export function useCreateTask(projectId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (task: {
      title: string;
      description?: string;
      status?: string;
      priority?: string;
      type?: string;
      assignee_id?: string | null;
      due_date?: string | null;
      labels?: string[];
      workspace_id: string;
      reporter_id: string;
      parent_task_id?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("tasks")
        .insert({ ...task, project_id: projectId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-stats", projectId] });
      if (data.parent_task_id) {
        queryClient.invalidateQueries({ queryKey: ["subtasks", data.parent_task_id] });
      }
    },
  });
}

export function useUpdateTask() {
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
      priority?: string;
      type?: string;
      assignee_id?: string | null;
      due_date?: string | null;
      labels?: string[];
      sort_order?: number;
    }) => {
      const { data, error } = await supabase
        .from("tasks")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", data.project_id] });
      queryClient.invalidateQueries({ queryKey: ["project-stats", data.project_id] });
    },
  });
}

export function useDeleteTask() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
      return { projectId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["tasks", data.projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-stats", data.projectId] });
    },
  });
}

export function useBulkUpdateTasks(projectId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ids,
      updates,
    }: {
      ids: string[];
      updates: { status?: string; assignee_id?: string | null; priority?: string };
    }) => {
      const { error } = await supabase
        .from("tasks")
        .update(updates)
        .in("id", ids);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-stats", projectId] });
    },
  });
}

export function useBulkDeleteTasks(projectId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase
        .from("tasks")
        .delete()
        .in("id", ids);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks", projectId] });
      queryClient.invalidateQueries({ queryKey: ["project-stats", projectId] });
    },
  });
}

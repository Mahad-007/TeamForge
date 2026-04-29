"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useProjects(workspaceId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["projects", workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(
          "*, lead:workspace_members!projects_lead_id_fkey(id, display_name, user_id)"
        )
        .eq("workspace_id", workspaceId)
        .neq("status", "archived")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });
}

export function useProject(projectSlug: string, workspaceId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["project", workspaceId, projectSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .eq("workspace_id", workspaceId)
        .eq("slug", projectSlug)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId && !!projectSlug,
  });
}

export function useCreateProject(workspaceId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (project: {
      name: string;
      slug: string;
      description?: string;
      status?: string;
      priority?: string;
      start_date?: string | null;
      target_date?: string | null;
      created_by: string;
      lead_id?: string | null;
    }) => {
      const { data, error } = await supabase
        .from("projects")
        .insert({ ...project, workspace_id: workspaceId })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects", workspaceId] });
    },
  });
}

export function useUpdateProject() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      name?: string;
      slug?: string;
      description?: string;
      status?: string;
      priority?: string;
      start_date?: string | null;
      target_date?: string | null;
      lead_id?: string | null;
      github_repo_url?: string | null;
      settings?: Record<string, string | number | boolean | null | string[]>;
    }) => {
      const { data, error } = await supabase
        .from("projects")
        .update(updates)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["projects", data.workspace_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["project", data.workspace_id, data.slug],
      });
    },
  });
}

export function useProjectMembers(projectId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["project-members", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("project_members")
        .select(
          "*, member:workspace_members(id, display_name, user_id)"
        )
        .eq("project_id", projectId);

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

export function useWorkspaceMembers(workspaceId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["workspace-members", workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workspace_members")
        .select(
          "*, role:roles(name, color)"
        )
        .eq("workspace_id", workspaceId)
        .eq("status", "active");

      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });
}

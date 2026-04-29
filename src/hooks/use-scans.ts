"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useLatestScan(projectId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["latest-scan", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("repository_scans")
        .select("*")
        .eq("project_id", projectId)
        .eq("status", "completed")
        .order("completed_at", { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== "PGRST116") throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

export function useScanHistory(projectId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["scan-history", projectId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("repository_scans")
        .select("id, status, branch, commit_sha, trigger_type, created_at, completed_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data;
    },
    enabled: !!projectId,
  });
}

export function useTriggerScan(projectId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      memberId,
      branch,
    }: {
      memberId: string;
      branch?: string;
    }) => {
      const { data, error } = await supabase
        .from("repository_scans")
        .insert({
          project_id: projectId,
          triggered_by: memberId,
          trigger_type: "manual",
          branch: branch ?? "main",
        })
        .select()
        .single();

      if (error) throw error;

      // Trigger processing via API route
      fetch("/api/scans/process", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scanId: data.id }),
      }).catch(console.error);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["scan-history", projectId] });
      queryClient.invalidateQueries({ queryKey: ["latest-scan", projectId] });
    },
  });
}

"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function useApiKeys(workspaceId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["api-keys", workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("api_keys")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });
}

export function useCreateApiKey(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      createdBy,
    }: {
      name: string;
      createdBy: string;
    }) => {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, name, createdBy }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to create API key");
      }

      return res.json() as Promise<{ key: string; id: string }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys", workspaceId] });
      toast.success("API key created");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useRevokeApiKey(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (keyId: string) => {
      const res = await fetch("/api/api-keys", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId, action: "revoke" }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to revoke API key");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys", workspaceId] });
      toast.success("API key revoked");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useDeleteApiKey(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (keyId: string) => {
      const res = await fetch("/api/api-keys", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to delete API key");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["api-keys", workspaceId] });
      toast.success("API key deleted");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

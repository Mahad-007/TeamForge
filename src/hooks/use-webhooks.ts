"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

export function useWebhooks(workspaceId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["webhooks", workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("webhooks")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });
}

export function useCreateWebhook(workspaceId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      url,
      events,
      createdBy,
    }: {
      url: string;
      events: string[];
      createdBy: string;
    }) => {
      // Generate a simple webhook secret
      const secret = Array.from(crypto.getRandomValues(new Uint8Array(32)))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");

      const { data, error } = await supabase
        .from("webhooks")
        .insert({
          workspace_id: workspaceId,
          url,
          events,
          is_active: true,
          created_by: createdBy,
          secret,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks", workspaceId] });
      toast.success("Webhook created");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useUpdateWebhook(workspaceId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: {
      id: string;
      url?: string;
      events?: string[];
      is_active?: boolean;
    }) => {
      const { error } = await supabase
        .from("webhooks")
        .update(updates)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks", workspaceId] });
      toast.success("Webhook updated");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

export function useDeleteWebhook(workspaceId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (webhookId: string) => {
      const { error } = await supabase
        .from("webhooks")
        .delete()
        .eq("id", webhookId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["webhooks", workspaceId] });
      toast.success("Webhook deleted");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });
}

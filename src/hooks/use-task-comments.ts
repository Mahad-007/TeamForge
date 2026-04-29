"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useTaskComments(taskId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["task-comments", taskId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("task_comments")
        .select(
          "*, author:workspace_members!task_comments_author_id_fkey(id, display_name, user_id)"
        )
        .eq("task_id", taskId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!taskId,
  });
}

export function useCreateComment(taskId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (comment: {
      content: string;
      author_id: string;
      parent_comment_id?: string | null;
      mentions?: string[];
    }) => {
      const { data, error } = await supabase
        .from("task_comments")
        .insert({
          ...comment,
          task_id: taskId,
        })
        .select(
          "*, author:workspace_members!task_comments_author_id_fkey(id, display_name, user_id)"
        )
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["task-comments", taskId] });
      queryClient.invalidateQueries({ queryKey: ["task-activity", taskId] });
    },
  });
}

export function useEditComment() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      content,
      taskId,
    }: {
      id: string;
      content: string;
      taskId: string;
    }) => {
      const { error } = await supabase
        .from("task_comments")
        .update({
          content,
          is_edited: true,
          edited_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
      return { taskId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["task-comments", data.taskId],
      });
    },
  });
}

export function useDeleteComment() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      taskId,
    }: {
      id: string;
      taskId: string;
    }) => {
      const { error } = await supabase
        .from("task_comments")
        .delete()
        .eq("id", id);

      if (error) throw error;
      return { taskId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["task-comments", data.taskId],
      });
    },
  });
}

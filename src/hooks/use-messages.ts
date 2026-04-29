"use client";

import { useEffect } from "react";
import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

const PAGE_SIZE = 50;

export function useMessages(channelId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["messages", channelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select(
          "*, sender:workspace_members!messages_sender_id_fkey(id, display_name, user_id)"
        )
        .eq("channel_id", channelId)
        .is("thread_id", null) // Only top-level messages
        .order("created_at", { ascending: true })
        .limit(PAGE_SIZE);

      if (error) throw error;
      return data;
    },
    enabled: !!channelId,
  });

  // Realtime subscription for new messages
  useEffect(() => {
    if (!channelId) return;

    // Use a unique name per effect invocation to avoid "cannot add callbacks
    // after subscribe()" errors when React re-runs effects before the async
    // removeChannel() from the previous cleanup has completed.
    const subId = Math.random().toString(36).slice(2);
    const channel = supabase
      .channel(`messages:${channelId}:${subId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "messages",
          filter: `channel_id=eq.${channelId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["messages", channelId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [channelId, supabase, queryClient]);

  return query;
}

export function useSendMessage(channelId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (message: {
      content: string;
      sender_id: string;
      type?: string;
      thread_id?: string | null;
      mentions?: string[];
    }) => {
      const { data, error } = await supabase
        .from("messages")
        .insert({
          ...message,
          channel_id: channelId,
          type: message.type ?? "text",
        })
        .select(
          "*, sender:workspace_members!messages_sender_id_fkey(id, display_name, user_id)"
        )
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["messages", channelId] });
    },
  });
}

export function useEditMessage() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      content,
      channelId,
    }: {
      id: string;
      content: string;
      channelId: string;
    }) => {
      const { error } = await supabase
        .from("messages")
        .update({
          content,
          is_edited: true,
          edited_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) throw error;
      return { channelId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", data.channelId],
      });
    },
  });
}

export function useDeleteMessage() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      channelId,
    }: {
      id: string;
      channelId: string;
    }) => {
      const { error } = await supabase
        .from("messages")
        .update({ is_deleted: true })
        .eq("id", id);

      if (error) throw error;
      return { channelId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", data.channelId],
      });
    },
  });
}

export function useToggleReaction() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageId,
      emoji,
      memberId,
      channelId,
    }: {
      messageId: string;
      emoji: string;
      memberId: string;
      channelId: string;
    }) => {
      // Fetch current reactions
      const { data: msg } = await supabase
        .from("messages")
        .select("reactions")
        .eq("id", messageId)
        .maybeSingle();

      const reactions = (msg?.reactions ?? {}) as Record<string, string[]>;
      const emojiList = reactions[emoji] ?? [];

      if (emojiList.includes(memberId)) {
        reactions[emoji] = emojiList.filter((id) => id !== memberId);
        if (reactions[emoji].length === 0) delete reactions[emoji];
      } else {
        reactions[emoji] = [...emojiList, memberId];
      }

      const { error } = await supabase
        .from("messages")
        .update({ reactions })
        .eq("id", messageId);

      if (error) throw error;
      return { channelId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", data.channelId],
      });
    },
  });
}

export function useThreadMessages(parentMessageId: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["thread-messages", parentMessageId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("messages")
        .select(
          "*, sender:workspace_members!messages_sender_id_fkey(id, display_name, user_id)"
        )
        .eq("thread_id", parentMessageId!)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!parentMessageId,
  });
}

export function usePinMessage() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageId,
      pinned,
      channelId,
    }: {
      messageId: string;
      pinned: boolean;
      channelId: string;
    }) => {
      const { error } = await supabase
        .from("messages")
        .update({ is_pinned: pinned })
        .eq("id", messageId);

      if (error) throw error;
      return { channelId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["messages", data.channelId],
      });
    },
  });
}

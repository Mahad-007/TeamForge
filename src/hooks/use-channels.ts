"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";

export function useChannels(workspaceId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["channels", workspaceId],
    queryFn: async () => {
      // Get channels the user is a member of (private/dm) + all public/project channels
      const { data, error } = await supabase
        .from("channels")
        .select("*, channel_members(last_read_at, member_id)")
        .eq("workspace_id", workspaceId)
        .eq("is_archived", false)
        .order("type", { ascending: true })
        .order("name", { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!workspaceId,
  });
}

export function useChannel(channelId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["channel", channelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("channels")
        .select("*")
        .eq("id", channelId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!channelId,
  });
}

export function useChannelMembers(channelId: string) {
  const supabase = createClient();

  return useQuery({
    queryKey: ["channel-members", channelId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("channel_members")
        .select("*, member:workspace_members(id, display_name, user_id)")
        .eq("channel_id", channelId);

      if (error) throw error;
      return data;
    },
    enabled: !!channelId,
  });
}

export function useCreateChannel(workspaceId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (channel: {
      name: string;
      description?: string;
      type: "public" | "private";
      created_by: string;
    }) => {
      // Use RPC to atomically create channel + add owner in one transaction.
      // Direct .insert().select().single() fails for private channels because
      // the SELECT RLS policy requires channel_members entry, which doesn't
      // exist yet at SELECT time.
      const { data, error } = await supabase.rpc("create_channel_with_owner", {
        p_workspace_id: workspaceId,
        p_name: channel.name,
        p_type: channel.type,
        p_created_by: channel.created_by,
        p_description: channel.description ?? null,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels", workspaceId] });
    },
  });
}

export function useJoinChannel() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      channelId,
      memberId,
      workspaceId,
    }: {
      channelId: string;
      memberId: string;
      workspaceId: string;
    }) => {
      const { error } = await supabase.from("channel_members").insert({
        channel_id: channelId,
        member_id: memberId,
      });
      if (error && error.code !== "23505") throw error; // ignore duplicate
      return { workspaceId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["channels", data.workspaceId] });
    },
  });
}

export function useCreateDM(workspaceId: string) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      currentMemberId,
      targetMemberId,
      targetName,
    }: {
      currentMemberId: string;
      targetMemberId: string;
      targetName: string;
    }) => {
      // Check if DM already exists between these two members
      const { data: existing } = await supabase
        .from("channels")
        .select("id, channel_members!inner(member_id)")
        .eq("workspace_id", workspaceId)
        .eq("type", "dm");

      // Find a DM channel where both members exist
      if (existing) {
        for (const ch of existing) {
          const memberIds = (ch.channel_members as { member_id: string }[]).map(
            (m) => m.member_id
          );
          if (
            memberIds.includes(currentMemberId) &&
            memberIds.includes(targetMemberId)
          ) {
            return ch;
          }
        }
      }

      // Create new DM channel
      const { data: channel, error } = await supabase
        .from("channels")
        .insert({
          workspace_id: workspaceId,
          name: `dm-${[currentMemberId, targetMemberId].sort().join("-")}`,
          type: "dm",
          created_by: currentMemberId,
        })
        .select()
        .single();

      if (error) throw error;

      // Add both members
      await supabase.from("channel_members").insert([
        { channel_id: channel.id, member_id: currentMemberId, role: "owner" },
        { channel_id: channel.id, member_id: targetMemberId, role: "member" },
      ]);

      return channel;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["channels", workspaceId] });
    },
  });
}

export function useMarkChannelRead() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      channelId,
      memberId,
      workspaceId,
    }: {
      channelId: string;
      memberId: string;
      workspaceId: string;
    }) => {
      const { error } = await supabase
        .from("channel_members")
        .update({ last_read_at: new Date().toISOString() })
        .eq("channel_id", channelId)
        .eq("member_id", memberId);

      if (error) throw error;
      return { workspaceId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["channels", data.workspaceId] });
    },
  });
}

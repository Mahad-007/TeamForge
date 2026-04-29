import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ChannelView } from "./channel-view";

export const metadata = { title: "Chat - TeamForge" };

export default async function ChannelPage({
  params,
}: {
  params: Promise<{ workspaceSlug: string; channelId: string }>;
}) {
  const { workspaceSlug, channelId } = await params;
  const supabase = await createServerSupabaseClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: workspace } = await supabase
    .from("workspaces")
    .select("id")
    .eq("slug", workspaceSlug)
    .single();
  if (!workspace) redirect("/onboarding");

  const { data: member } = await supabase
    .from("workspace_members")
    .select("id, display_name")
    .eq("workspace_id", workspace.id)
    .eq("user_id", user.id)
    .single();
  if (!member) redirect("/onboarding");

  // Auto-join public channels
  const { data: channel } = await supabase
    .from("channels")
    .select("type")
    .eq("id", channelId)
    .single();

  if (channel && (channel.type === "public" || channel.type === "project")) {
    await supabase.from("channel_members").upsert(
      { channel_id: channelId, member_id: member.id },
      { onConflict: "channel_id,member_id" }
    );
  }

  // Mark as read
  await supabase
    .from("channel_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("channel_id", channelId)
    .eq("member_id", member.id);

  return (
    <ChannelView
      channelId={channelId}
      workspaceId={workspace.id}
      currentMemberId={member.id}
      currentMemberName={member.display_name ?? user.email?.split("@")[0] ?? "User"}
    />
  );
}

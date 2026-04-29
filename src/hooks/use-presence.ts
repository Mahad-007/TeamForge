"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface PresenceState {
  user_id: string;
  status: "online" | "away" | "offline";
  last_seen: string;
}

export function usePresence(workspaceId: string, userId: string) {
  const supabase = createClient();
  const [onlineUsers, setOnlineUsers] = useState<Map<string, PresenceState>>(
    new Map()
  );

  useEffect(() => {
    if (!workspaceId || !userId) return;

    // Use a unique name per effect invocation to avoid stale channel name
    // collisions when React re-runs effects before async cleanup completes.
    const subId = Math.random().toString(36).slice(2);
    const channel = supabase.channel(`presence:${workspaceId}:${subId}`, {
      config: { presence: { key: userId } },
    });
    if (!channel) return;

    let cleaned = false;

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users = new Map<string, PresenceState>();
        Object.entries(state).forEach(([key, presences]) => {
          if (presences.length > 0) {
            users.set(key, presences[0] as unknown as PresenceState);
          }
        });
        setOnlineUsers(users);
      })
      ?.subscribe(async (status) => {
        if (status === "SUBSCRIBED" && !cleaned) {
          await channel.track({
            user_id: userId,
            status: "online",
            last_seen: new Date().toISOString(),
          });
        }
      });

    // Track away status after 5 min idle
    let idleTimeout: ReturnType<typeof setTimeout>;
    const resetIdle = () => {
      if (cleaned) return;
      clearTimeout(idleTimeout);
      channel?.track({
        user_id: userId,
        status: "online",
        last_seen: new Date().toISOString(),
      });
      idleTimeout = setTimeout(() => {
        if (cleaned) return;
        channel?.track({
          user_id: userId,
          status: "away",
          last_seen: new Date().toISOString(),
        });
      }, 5 * 60 * 1000);
    };

    window.addEventListener("mousemove", resetIdle);
    window.addEventListener("keydown", resetIdle);

    return () => {
      cleaned = true;
      if (channel) supabase.removeChannel(channel);
      clearTimeout(idleTimeout);
      window.removeEventListener("mousemove", resetIdle);
      window.removeEventListener("keydown", resetIdle);
    };
  }, [workspaceId, userId, supabase]);

  return onlineUsers;
}

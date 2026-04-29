"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export function useTyping(channelId: string, displayName: string) {
  const supabase = createClient();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const lastSentRef = useRef(0);

  useEffect(() => {
    if (!channelId) return;

    const subId = Math.random().toString(36).slice(2);
    const channel = supabase.channel(`typing:${channelId}:${subId}`);
    channelRef.current = channel;

    channel
      .on("broadcast", { event: "typing" }, ({ payload }) => {
        const name = payload.display_name as string;
        setTypingUsers((prev) => {
          if (name === displayName) return prev; // Don't show self
          if (!prev.includes(name)) return [...prev, name];
          return prev;
        });

        // Auto-clear after 3 seconds
        setTimeout(() => {
          setTypingUsers((prev) => prev.filter((n) => n !== name));
        }, 3000);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [channelId, displayName, supabase]);

  const sendTyping = useCallback(() => {
    const now = Date.now();
    // Debounce: only send every 2 seconds
    if (now - lastSentRef.current < 2000) return;
    lastSentRef.current = now;

    channelRef.current?.send({
      type: "broadcast",
      event: "typing",
      payload: { display_name: displayName },
    });
  }, [displayName]);

  return { typingUsers, sendTyping };
}

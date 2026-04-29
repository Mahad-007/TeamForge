"use client";

import { useAIPanelStore } from "@/stores/ai-panel";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function FloatingAIButton() {
  const { isOpen, toggle } = useAIPanelStore();

  if (isOpen) return null;

  return (
    <button
      onClick={toggle}
      className={cn(
        "fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-105 hover:shadow-xl",
        "animate-in fade-in zoom-in duration-200"
      )}
      title="Open AI Assistant (Cmd+J)"
    >
      <Sparkles className="h-5 w-5" />
    </button>
  );
}

"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { useChat } from "@ai-sdk/react";
import { useAIPanelStore } from "@/stores/ai-panel";
import { AIMessage } from "./ai-message";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { X, Trash2, Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AIChatPanelProps {
  workspaceId: string;
  workspaceName: string;
  userName: string;
}

export function AIChatPanel({
  workspaceId,
  workspaceName,
  userName,
}: AIChatPanelProps) {
  const { isOpen, close, contextType, contextName } = useAIPanelStore();
  const bottomRef = useRef<HTMLDivElement>(null);
  const [inputValue, setInputValue] = useState("");

  const chatOptions = useMemo(
    () => ({
      transport: {
        api: "/api/ai/chat",
        body: {
          workspaceId,
          workspaceName,
          userName,
          projectName:
            contextType === "project" ? contextName : undefined,
        },
      } as any,
    }),
    [workspaceId, workspaceName, userName, contextType, contextName]
  );

  const { messages, sendMessage, stop, setMessages, status } =
    useChat(chatOptions);

  const isLoading = status === "streaming" || status === "submitted";

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  function handleSend() {
    if (!inputValue.trim() || isLoading) return;
    sendMessage({ text: inputValue.trim() });
    setInputValue("");
  }

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed bottom-4 right-4 z-50 flex w-96 flex-col rounded-xl border bg-background shadow-2xl",
        "animate-in slide-in-from-bottom-4 fade-in duration-200"
      )}
      style={{ height: "min(600px, calc(100vh - 120px))" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div>
          <h3 className="text-sm font-semibold">TeamForge AI</h3>
          {contextName && (
            <p className="text-[10px] text-muted-foreground">
              Context: {contextName}
            </p>
          )}
        </div>
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setMessages([])}
            title="Clear chat"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={close}
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center py-12 text-center">
            <div>
              <p className="text-sm font-medium">How can I help?</p>
              <p className="mt-1 text-xs text-muted-foreground">
                Ask about projects, tasks, or team workload.
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {[
                  "How is the project going?",
                  "Show me overdue tasks",
                  "What bugs are open?",
                ].map((suggestion) => (
                  <button
                    key={suggestion}
                    className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    onClick={() => setInputValue(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <AIMessage
                key={msg.id}
                role={msg.role as "user" | "assistant"}
                content={
                  msg.parts
                    ?.filter((p) => p.type === "text")
                    .map((p) => ("text" in p ? p.text : ""))
                    .join("") ?? ""
                }
              />
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                Thinking...
              </div>
            )}
          </div>
        )}
        <div ref={bottomRef} />
      </ScrollArea>

      {/* Input */}
      <div className="border-t p-3">
        <div className="flex gap-2">
          <input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask anything..."
            className="flex-1 rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            disabled={isLoading}
          />
          {isLoading ? (
            <Button type="button" size="icon" variant="outline" onClick={stop}>
              <span className="h-3 w-3 rounded-sm bg-foreground" />
            </Button>
          ) : (
            <Button
              size="icon"
              disabled={!inputValue.trim()}
              onClick={handleSend}
            >
              <Send className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

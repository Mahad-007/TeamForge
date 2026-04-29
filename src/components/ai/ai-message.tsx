"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Sparkles, User } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface AIMessageProps {
  role: "user" | "assistant";
  content: string;
  toolInvocations?: Array<{
    toolName: string;
    state: string;
    result?: unknown;
  }>;
}

export function AIMessage({ role, content, toolInvocations }: AIMessageProps) {
  const isUser = role === "user";

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}>
      <Avatar className="h-7 w-7 shrink-0">
        <AvatarFallback
          className={
            isUser
              ? "bg-primary text-primary-foreground"
              : "bg-primary/10 text-primary"
          }
        >
          {isUser ? <User className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
        </AvatarFallback>
      </Avatar>

      <div
        className={`max-w-[85%] space-y-2 ${
          isUser ? "text-right" : "text-left"
        }`}
      >
        {/* Tool invocations */}
        {toolInvocations?.map((invocation, i) => (
          <div key={i} className="space-y-1">
            {invocation.state === "call" && (
              <Badge variant="secondary" className="text-[10px] gap-1">
                <Sparkles className="h-2.5 w-2.5 animate-spin" />
                Using {invocation.toolName}...
              </Badge>
            )}
            {invocation.state === "result" && invocation.result != null && (
              <div className="rounded-md bg-muted/50 p-2 text-xs">
                <p className="font-medium text-muted-foreground">
                  {invocation.toolName}
                </p>
                <pre className="mt-1 whitespace-pre-wrap text-[11px] text-foreground">
                  {typeof invocation.result === "string"
                    ? invocation.result
                    : JSON.stringify(invocation.result as object, null, 2).slice(0, 300)}
                </pre>
              </div>
            )}
          </div>
        ))}

        {/* Message content */}
        {content && (
          <div
            className={`inline-block rounded-lg px-3 py-2 text-sm ${
              isUser
                ? "bg-primary text-primary-foreground"
                : "bg-muted"
            }`}
          >
            <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:mb-1 [&>p]:mt-0 [&>ul]:my-1 [&>ol]:my-1">
              <ReactMarkdown>{content}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

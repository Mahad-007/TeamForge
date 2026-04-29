"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSendMessage } from "@/hooks/use-messages";
import { useWorkspaceMembersWithProfiles } from "@/hooks/use-members";
import { Button } from "@/components/ui/button";
import { EmojiPicker } from "@/components/chat/emoji-picker";
import { MentionDropdown } from "@/components/chat/mention-dropdown";
import { Send } from "lucide-react";

interface MessageInputProps {
  channelId: string;
  currentMemberId: string;
  workspaceId?: string;
  threadId?: string | null;
  onTyping?: () => void;
  placeholder?: string;
}

export function MessageInput({
  channelId,
  currentMemberId,
  workspaceId,
  threadId,
  onTyping,
  placeholder = "Type a message...",
}: MessageInputProps) {
  const [content, setContent] = useState("");
  const sendMessage = useSendMessage(channelId);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Members for @mention autocomplete
  const { data: membersData } = useWorkspaceMembersWithProfiles(
    workspaceId ?? ""
  );
  const members = (membersData ?? []).map((m) => ({
    id: m.id,
    display_name: m.display_name,
  }));

  // Mention state
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionVisible, setMentionVisible] = useState(false);
  const [mentionStart, setMentionStart] = useState<number | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height =
        Math.min(textareaRef.current.scrollHeight, 160) + "px";
    }
  }, [content]);

  // Detect @mention trigger
  const detectMention = useCallback(
    (value: string, cursorPos: number) => {
      // Look backwards from cursor for '@'
      const textBeforeCursor = value.slice(0, cursorPos);
      const lastAtIndex = textBeforeCursor.lastIndexOf("@");

      if (lastAtIndex === -1) {
        setMentionVisible(false);
        return;
      }

      // Check that @ is at start or preceded by a space/newline
      if (lastAtIndex > 0 && !/\s/.test(textBeforeCursor[lastAtIndex - 1])) {
        setMentionVisible(false);
        return;
      }

      const query = textBeforeCursor.slice(lastAtIndex + 1);
      // No spaces in mention query (means they finished the mention)
      if (/\s/.test(query)) {
        setMentionVisible(false);
        return;
      }

      setMentionStart(lastAtIndex);
      setMentionQuery(query);
      setMentionVisible(true);
    },
    []
  );

  function handleChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    const value = e.target.value;
    setContent(value);
    onTyping?.();

    const cursorPos = e.target.selectionStart;
    detectMention(value, cursorPos);
  }

  function handleMentionSelect(member: {
    id: string;
    display_name: string | null;
  }) {
    if (mentionStart === null) return;
    const name = member.display_name ?? "Unknown";
    const before = content.slice(0, mentionStart);
    const cursorPos = textareaRef.current?.selectionStart ?? content.length;
    const after = content.slice(cursorPos);
    const newContent = `${before}@${name} ${after}`;
    setContent(newContent);
    setMentionVisible(false);
    setMentionStart(null);

    // Refocus textarea and place cursor after the inserted mention
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        const newCursorPos = before.length + name.length + 2; // @name + space
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    });
  }

  function handleEmojiSelect(emoji: string) {
    if (!textareaRef.current) {
      setContent((prev) => prev + emoji);
      return;
    }

    const start = textareaRef.current.selectionStart;
    const end = textareaRef.current.selectionEnd;
    const before = content.slice(0, start);
    const after = content.slice(end);
    const newContent = before + emoji + after;
    setContent(newContent);

    // Place cursor after inserted emoji
    requestAnimationFrame(() => {
      if (textareaRef.current) {
        const newPos = start + emoji.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    });
  }

  async function handleSend() {
    if (!content.trim()) return;

    const trimmed = content.trim();
    setContent("");
    setMentionVisible(false);

    // Extract @mentions (basic: find @word patterns)
    const mentionRegex = /@(\w+)/g;
    const mentionMatches = [...trimmed.matchAll(mentionRegex)];
    // For now, mentions are stored as text. Full mention resolution requires member lookup.

    await sendMessage.mutateAsync({
      content: trimmed,
      sender_id: currentMemberId,
      thread_id: threadId ?? undefined,
    });
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    // If mention dropdown is visible, let it handle arrow/enter keys
    if (mentionVisible) {
      if (
        e.key === "ArrowDown" ||
        e.key === "ArrowUp" ||
        e.key === "Enter"
      ) {
        return; // MentionDropdown captures these via document listener
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setMentionVisible(false);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="relative flex items-end gap-2 border-t bg-background p-3">
      <MentionDropdown
        query={mentionQuery}
        members={members}
        onSelect={handleMentionSelect}
        visible={mentionVisible}
      />
      <EmojiPicker onSelect={handleEmojiSelect} />
      <textarea
        ref={textareaRef}
        value={content}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={1}
        className="flex-1 resize-none rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      <Button
        size="icon"
        onClick={handleSend}
        disabled={!content.trim() || sendMessage.isPending}
        className="shrink-0"
      >
        <Send className="h-4 w-4" />
      </Button>
    </div>
  );
}

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface MentionDropdownProps {
  query: string;
  members: { id: string; display_name: string | null }[];
  onSelect: (member: { id: string; display_name: string | null }) => void;
  visible: boolean;
}

export function MentionDropdown({
  query,
  members,
  onSelect,
  visible,
}: MentionDropdownProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);

  const filtered = members.filter((m) => {
    const name = (m.display_name ?? "").toLowerCase();
    return name.includes(query.toLowerCase());
  });

  // Reset selection when query or visibility changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, visible]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll("[data-mention-item]");
    items[selectedIndex]?.scrollIntoView({ block: "nearest" });
  }, [selectedIndex]);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!visible || filtered.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev <= 0 ? filtered.length - 1 : prev - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        onSelect(filtered[selectedIndex]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        // Parent component should handle closing via visibility
      }
    },
    [visible, filtered, selectedIndex, onSelect]
  );

  useEffect(() => {
    if (visible) {
      document.addEventListener("keydown", handleKeyDown, true);
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
    };
  }, [visible, handleKeyDown]);

  if (!visible || filtered.length === 0) return null;

  return (
    <div
      ref={listRef}
      className="absolute bottom-full left-0 z-50 mb-1 max-h-48 w-64 overflow-y-auto rounded-lg border bg-popover p-1 shadow-md"
    >
      {filtered.map((member, index) => {
        const name = member.display_name ?? "Unknown";
        const initials = name
          .split(" ")
          .map((w) => w[0])
          .join("")
          .toUpperCase()
          .slice(0, 2);

        return (
          <button
            key={member.id}
            type="button"
            data-mention-item
            className={cn(
              "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm transition-colors",
              index === selectedIndex
                ? "bg-accent text-accent-foreground"
                : "text-foreground hover:bg-accent/50"
            )}
            onClick={() => onSelect(member)}
            onMouseEnter={() => setSelectedIndex(index)}
          >
            <Avatar size="sm">
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <span className="truncate">{name}</span>
          </button>
        );
      })}
    </div>
  );
}

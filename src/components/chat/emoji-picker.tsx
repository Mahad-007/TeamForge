"use client";

import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Smile } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
}

const EMOJI_CATEGORIES: { label: string; emojis: string[] }[] = [
  {
    label: "Smileys",
    emojis: [
      "😀", "😃", "😄", "😁", "😅", "😂", "🤣", "😊", "😇", "🙂",
      "😉", "😍", "🥰", "😘", "😜", "🤔", "😐", "😶", "🙄", "😏",
    ],
  },
  {
    label: "Gestures",
    emojis: [
      "👍", "👎", "👏", "🙌", "🤝", "🤞", "✌️", "🤟", "👋", "💪",
    ],
  },
  {
    label: "People",
    emojis: [
      "🧑‍💻", "🙋", "🤷", "🎉", "💯", "🔥", "⭐", "❤️", "💔", "💡",
    ],
  },
  {
    label: "Nature",
    emojis: [
      "🌞", "🌈", "☁️", "⚡", "🌊", "🌸", "🌿", "🍀", "🐱", "🐶",
    ],
  },
  {
    label: "Food",
    emojis: [
      "☕", "🍕", "🍔", "🎂", "🍰", "🍩", "🍺", "🥤", "🍎", "🥑",
    ],
  },
  {
    label: "Objects",
    emojis: [
      "💻", "📱", "📧", "📎", "✅", "❌", "⚠️", "🚀", "🎯", "🏆",
    ],
  },
];

export function EmojiPicker({ onSelect }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  function handleSelect(emoji: string) {
    onSelect(emoji);
    setOpen(false);
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Smile className="h-4 w-4" />
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-80 p-2">
        <div className="max-h-64 overflow-y-auto">
          {EMOJI_CATEGORIES.map((category) => (
            <div key={category.label} className="mb-2">
              <p className="mb-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                {category.label}
              </p>
              <div className="grid grid-cols-10 gap-0.5">
                {category.emojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => handleSelect(emoji)}
                    className="flex h-7 w-7 items-center justify-center rounded text-base transition-colors hover:bg-accent"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}

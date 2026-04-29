"use client";

import { useCallback, useMemo, useRef } from "react";
import { BlockNoteEditor } from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/mantine/style.css";
import type { Json } from "@/types/database";

interface BlockEditorProps {
  initialContent?: Json;
  onChange?: (content: Json) => void;
  editable?: boolean;
}

export function BlockEditor({
  initialContent,
  onChange,
  editable = true,
}: BlockEditorProps) {
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const parsedContent = useMemo(() => {
    if (!initialContent) return undefined;
    if (Array.isArray(initialContent) && initialContent.length === 0) return undefined;
    try {
      return initialContent as Parameters<typeof BlockNoteEditor.create>[0] extends { initialContent?: infer C } ? C : never;
    } catch {
      return undefined;
    }
  }, [initialContent]);

  const editor = useCreateBlockNote({
    initialContent: parsedContent as any,
  });

  const handleChange = useCallback(() => {
    if (!onChange) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const blocks = editor.document;
      onChange(blocks as unknown as Json);
    }, 500);
  }, [editor, onChange]);

  return (
    <div className="min-h-[300px] [&_.bn-editor]:min-h-[300px] [&_.bn-container]:border-none [&_.bn-container]:shadow-none">
      <BlockNoteView
        editor={editor}
        editable={editable}
        onChange={handleChange}
        theme="light"
      />
    </div>
  );
}

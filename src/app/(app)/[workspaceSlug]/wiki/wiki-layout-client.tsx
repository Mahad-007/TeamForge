"use client";

import { useState } from "react";
import { useWikiTree } from "@/hooks/use-wiki";
import { PageTree } from "@/components/wiki/page-tree";
import { TemplatePicker } from "@/components/wiki/template-picker";

interface WikiLayoutClientProps {
  workspaceId: string;
  workspaceSlug: string;
  memberId: string;
  children: React.ReactNode;
}

export function WikiLayoutClient({
  workspaceId,
  workspaceSlug,
  memberId,
  children,
}: WikiLayoutClientProps) {
  const { tree } = useWikiTree(workspaceId);
  const [newPageParent, setNewPageParent] = useState<string | undefined>();
  const [showPicker, setShowPicker] = useState(false);

  function handleNewPage(parentId?: string) {
    setNewPageParent(parentId);
    setShowPicker(true);
  }

  return (
    <div className="-m-6 flex h-[calc(100vh-3.5rem)]">
      <PageTree
        tree={tree}
        basePath={`/${workspaceSlug}/wiki`}
        onNewPage={handleNewPage}
      />
      <div className="flex flex-1 flex-col overflow-hidden">
        {children}
      </div>

      <TemplatePicker
        open={showPicker}
        onClose={() => setShowPicker(false)}
        workspaceId={workspaceId}
        memberId={memberId}
        parentPageId={newPageParent}
        basePath={`/${workspaceSlug}/wiki`}
      />
    </div>
  );
}

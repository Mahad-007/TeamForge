"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useWikiPage, useUpdateWikiPage } from "@/hooks/use-wiki";
import { PageHeader } from "@/components/wiki/page-header";
import { VersionHistory } from "@/components/wiki/version-history";
import { Skeleton } from "@/components/ui/skeleton";
import type { Json } from "@/types/database";

// Dynamic import - BlockNote doesn't support SSR
const BlockEditor = dynamic(
  () =>
    import("@/components/wiki/block-editor").then((mod) => ({
      default: mod.BlockEditor,
    })),
  {
    ssr: false,
    loading: () => <Skeleton className="m-8 h-64" />,
  }
);

interface WikiPageViewProps {
  pageId: string;
  memberId: string;
  workspaceId: string;
}

export function WikiPageView({
  pageId,
  memberId,
  workspaceId,
}: WikiPageViewProps) {
  const { data: page, isLoading } = useWikiPage(pageId);
  const updatePage = useUpdateWikiPage();
  const [showHistory, setShowHistory] = useState(false);

  if (isLoading) {
    return (
      <div className="p-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-4 w-32 mb-8" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!page) {
    return (
      <div className="flex h-full items-center justify-center text-muted-foreground">
        Page not found.
      </div>
    );
  }

  const lastEditorName = (
    page.last_editor as { display_name: string | null } | null
  )?.display_name;

  function handleContentChange(content: Json) {
    updatePage.mutate({
      id: pageId,
      memberId,
      content,
    });
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <PageHeader
        pageId={pageId}
        title={page.title}
        icon={page.icon}
        lastEditorName={lastEditorName ?? null}
        updatedAt={page.updated_at}
        memberId={memberId}
        onShowHistory={() => setShowHistory(true)}
      />

      <div className="flex-1 px-8 py-4">
        <BlockEditor
          key={pageId}
          initialContent={page.content as Json}
          onChange={handleContentChange}
        />
      </div>

      <VersionHistory
        pageId={pageId}
        memberId={memberId}
        open={showHistory}
        onClose={() => setShowHistory(false)}
      />
    </div>
  );
}

"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useWikiTree, useWikiPage, useUpdateWikiPage } from "@/hooks/use-wiki";
import { PageTree } from "@/components/wiki/page-tree";
import { PageHeader } from "@/components/wiki/page-header";
import { VersionHistory } from "@/components/wiki/version-history";
import { TemplatePicker } from "@/components/wiki/template-picker";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, BookOpen } from "lucide-react";
import type { Json } from "@/types/database";

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

interface ProjectDocsClientProps {
  workspaceId: string;
  workspaceSlug: string;
  projectId: string;
  projectName: string;
  projectSlug: string;
  memberId: string;
}

export function ProjectDocsClient({
  workspaceId,
  workspaceSlug,
  projectId,
  projectName,
  projectSlug,
  memberId,
}: ProjectDocsClientProps) {
  const { tree } = useWikiTree(workspaceId, projectId);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [newPageParent, setNewPageParent] = useState<string | undefined>();
  const [showHistory, setShowHistory] = useState(false);

  const { data: page } = useWikiPage(selectedPageId ?? "");
  const updatePage = useUpdateWikiPage();

  const basePath = `/${workspaceSlug}/projects/${projectSlug}/docs`;

  function handleNewPage(parentId?: string) {
    setNewPageParent(parentId);
    setShowPicker(true);
  }

  const lastEditorName = page
    ? ((page.last_editor as { display_name: string | null } | null)?.display_name ?? null)
    : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href={`/${workspaceSlug}/projects/${projectSlug}`}>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-xl font-bold">{projectName}</h1>
          <p className="text-sm text-muted-foreground">Documentation</p>
        </div>
      </div>

      <div className="-mx-6 flex" style={{ height: "calc(100vh - 200px)" }}>
        <PageTree
          tree={tree}
          basePath={basePath}
          onNewPage={handleNewPage}
        />
        <div className="flex flex-1 flex-col overflow-hidden">
          {page ? (
            <>
              <PageHeader
                pageId={page.id}
                title={page.title}
                icon={page.icon}
                lastEditorName={lastEditorName}
                updatedAt={page.updated_at}
                memberId={memberId}
                onShowHistory={() => setShowHistory(true)}
              />
              <div className="flex-1 overflow-y-auto px-8 py-4">
                <BlockEditor
                  key={page.id}
                  initialContent={page.content as Json}
                  onChange={(content) =>
                    updatePage.mutate({ id: page.id, memberId, content })
                  }
                />
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              <div className="text-center">
                <BookOpen className="mx-auto h-10 w-10" />
                <p className="mt-3 text-sm">
                  Select a page or create a new one.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <TemplatePicker
        open={showPicker}
        onClose={() => setShowPicker(false)}
        workspaceId={workspaceId}
        memberId={memberId}
        parentPageId={newPageParent}
        projectId={projectId}
        basePath={basePath}
      />

      {page && (
        <VersionHistory
          pageId={page.id}
          memberId={memberId}
          open={showHistory}
          onClose={() => setShowHistory(false)}
        />
      )}
    </div>
  );
}

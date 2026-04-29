"use client";

import { useWikiVersions, useUpdateWikiPage } from "@/hooks/use-wiki";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";

interface VersionHistoryProps {
  pageId: string | null;
  memberId: string;
  open: boolean;
  onClose: () => void;
}

export function VersionHistory({
  pageId,
  memberId,
  open,
  onClose,
}: VersionHistoryProps) {
  const { data: versions } = useWikiVersions(pageId ?? "");
  const updatePage = useUpdateWikiPage();

  function handleRestore(version: { content: unknown; title: string }) {
    if (!pageId) return;
    updatePage.mutate(
      {
        id: pageId,
        memberId,
        content: version.content as any,
        title: version.title,
      },
      {
        onSuccess: () => {
          toast.success("Version restored");
          onClose();
        },
      }
    );
  }

  return (
    <Sheet open={open} onOpenChange={() => onClose()}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Version History</SheetTitle>
        </SheetHeader>
        <ScrollArea className="mt-4 h-[calc(100vh-120px)]">
          {versions && versions.length > 0 ? (
            <div className="space-y-1">
              {versions.map((version) => {
                const editorName = (
                  version.editor as { display_name: string | null } | null
                )?.display_name;
                return (
                  <div
                    key={version.id}
                    className="flex items-center justify-between rounded-md border p-3"
                  >
                    <div>
                      <p className="text-sm font-medium">{version.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {editorName ?? "Unknown"} &middot;{" "}
                        {formatDistanceToNow(new Date(version.created_at!), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1.5 text-xs"
                      onClick={() => handleRestore(version)}
                    >
                      <RotateCcw className="h-3 w-3" />
                      Restore
                    </Button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No versions yet. Versions are created when you edit a page.
            </p>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

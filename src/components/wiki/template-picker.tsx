"use client";

import { useWikiTemplates, useCreateWikiPage } from "@/hooks/use-wiki";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import type { Json } from "@/types/database";

interface TemplatePickerProps {
  open: boolean;
  onClose: () => void;
  workspaceId: string;
  memberId: string;
  parentPageId?: string | null;
  projectId?: string | null;
  basePath: string;
}

export function TemplatePicker({
  open,
  onClose,
  workspaceId,
  memberId,
  parentPageId,
  projectId,
  basePath,
}: TemplatePickerProps) {
  const router = useRouter();
  const { data: templates } = useWikiTemplates(workspaceId);
  const createPage = useCreateWikiPage(workspaceId);

  async function handleCreate(content?: Json, title?: string) {
    const page = await createPage.mutateAsync({
      title: title ?? "Untitled",
      content: content ?? [],
      parent_page_id: parentPageId,
      project_id: projectId,
      created_by: memberId,
      last_edited_by: memberId,
    });

    onClose();
    router.push(`${basePath}/${page.id}`);
  }

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Page</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <Card
            className="cursor-pointer transition-shadow hover:shadow-md"
            onClick={() => handleCreate()}
          >
            <CardContent className="flex items-center gap-3 p-4">
              <FileText className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Blank page</p>
                <p className="text-xs text-muted-foreground">
                  Start from scratch
                </p>
              </div>
            </CardContent>
          </Card>

          {templates && templates.length > 0 && (
            <>
              <p className="text-xs font-medium text-muted-foreground">
                Templates
              </p>
              {templates.map((template) => (
                <Card
                  key={template.id}
                  className="cursor-pointer transition-shadow hover:shadow-md"
                  onClick={() =>
                    handleCreate(template.content as Json, template.title)
                  }
                >
                  <CardContent className="flex items-center gap-3 p-4">
                    <span className="text-lg">
                      {template.icon ?? <FileText className="h-5 w-5" />}
                    </span>
                    <p className="font-medium">{template.title}</p>
                  </CardContent>
                </Card>
              ))}
            </>
          )}
        </div>

        {createPage.isPending && (
          <div className="flex justify-center py-2">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

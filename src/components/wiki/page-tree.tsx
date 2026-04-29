"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronRight, FileText, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface TreeNode {
  id: string;
  title: string;
  icon: string | null;
  children?: TreeNode[];
}

interface PageTreeProps {
  tree: TreeNode[];
  basePath: string;
  onNewPage: (parentId?: string) => void;
}

function TreeItem({
  node,
  basePath,
  depth,
  onNewPage,
}: {
  node: TreeNode;
  basePath: string;
  depth: number;
  onNewPage: (parentId?: string) => void;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(true);
  const href = `${basePath}/${node.id}`;
  const isActive = pathname === href;
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div>
      <div
        className={cn(
          "group flex items-center gap-1 rounded-md text-sm transition-colors",
          isActive
            ? "bg-accent font-medium text-accent-foreground"
            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
        )}
        style={{ paddingLeft: `${depth * 16 + 4}px` }}
      >
        {hasChildren ? (
          <Collapsible open={open} onOpenChange={setOpen}>
            <CollapsibleTrigger className="p-1">
              <ChevronRight
                className={cn(
                  "h-3 w-3 transition-transform",
                  open && "rotate-90"
                )}
              />
            </CollapsibleTrigger>
          </Collapsible>
        ) : (
          <span className="w-5" />
        )}

        <Link href={href} className="flex flex-1 items-center gap-2 py-1.5 pr-2">
          <span className="shrink-0 text-sm">
            {node.icon ?? <FileText className="h-3.5 w-3.5" />}
          </span>
          <span className="truncate">{node.title}</span>
        </Link>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onNewPage(node.id);
          }}
          className="mr-1 hidden rounded p-0.5 hover:bg-accent group-hover:block"
        >
          <Plus className="h-3 w-3" />
        </button>
      </div>

      {hasChildren && open && (
        <div>
          {node.children!.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              basePath={basePath}
              depth={depth + 1}
              onNewPage={onNewPage}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function PageTree({ tree, basePath, onNewPage }: PageTreeProps) {
  return (
    <div className="flex h-full w-60 flex-col border-r bg-muted/30">
      <div className="flex items-center justify-between border-b px-3 py-3">
        <h2 className="text-sm font-semibold">Pages</h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onNewPage()}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1 p-2">
        {tree.length > 0 ? (
          tree.map((node) => (
            <TreeItem
              key={node.id}
              node={node}
              basePath={basePath}
              depth={0}
              onNewPage={onNewPage}
            />
          ))
        ) : (
          <div className="py-8 text-center text-sm text-muted-foreground">
            <p>No pages yet.</p>
            <p className="mt-1 text-xs">Click + to create one.</p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

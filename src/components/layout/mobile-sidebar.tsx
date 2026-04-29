"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "./sidebar";

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceSlug: string;
  workspaceName: string;
}

export function MobileSidebar({
  open,
  onOpenChange,
  workspaceSlug,
  workspaceName,
}: MobileSidebarProps) {
  const pathname = usePathname();

  // Close on navigation
  useEffect(() => {
    onOpenChange(false);
  }, [pathname, onOpenChange]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onOpenChange(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 md:hidden">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      <div
        className="relative z-50 h-full animate-in slide-in-from-left duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <Sidebar workspaceSlug={workspaceSlug} workspaceName={workspaceName} />
      </div>
    </div>
  );
}

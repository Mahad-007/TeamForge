"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  MessageSquare,
  BookOpen,
  Users,
  Shield,
  BarChart3,
  Settings,
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { WorkspaceSwitcher } from "./workspace-switcher";

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceSlug: string;
  workspaceName: string;
}

const navItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard" },
  { label: "Projects", icon: FolderKanban, href: "/projects" },
  { label: "Chat", icon: MessageSquare, href: "/chat" },
  { label: "Wiki", icon: BookOpen, href: "/wiki" },
];

const managementItems = [
  { label: "Members", icon: Users, href: "/members" },
  { label: "Roles", icon: Shield, href: "/roles" },
  { label: "Analytics", icon: BarChart3, href: "/analytics" },
  { label: "Settings", icon: Settings, href: "/settings" },
];

export function MobileSidebar({
  open,
  onOpenChange,
  workspaceSlug,
  workspaceName,
}: MobileSidebarProps) {
  const pathname = usePathname();
  const base = `/${workspaceSlug}`;

  function navigate() {
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-64 p-0">
        <SheetHeader className="border-b px-3 py-4">
          <SheetTitle className="text-sm">
            <WorkspaceSwitcher
              currentSlug={workspaceSlug}
              currentName={workspaceName}
            />
          </SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1 py-2">
          <nav className="space-y-1 px-2">
            {navItems.map((item) => {
              const href = `${base}${item.href}`;
              const isActive =
                pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={item.href}
                  href={href}
                  onClick={navigate}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <Separator className="my-3" />

          <nav className="space-y-1 px-2">
            {managementItems.map((item) => {
              const href = `${base}${item.href}`;
              const isActive =
                pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={item.href}
                  href={href}
                  onClick={navigate}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                  )}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

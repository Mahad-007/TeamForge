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
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { useState } from "react";

interface SidebarProps {
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

export function Sidebar({ workspaceSlug, workspaceName }: SidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const base = `/${workspaceSlug}`;

  return (
    <aside
      className={cn(
        "hidden h-screen flex-col border-r bg-sidebar text-sidebar-foreground transition-all duration-200 md:flex",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Workspace header */}
      <div className="flex h-14 items-center border-b px-3">
        {!collapsed && (
          <WorkspaceSwitcher
            currentSlug={workspaceSlug}
            currentName={workspaceName}
          />
        )}
        <Button
          variant="ghost"
          size="icon"
          className={cn("ml-auto h-8 w-8 shrink-0", collapsed && "mx-auto")}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

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
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
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
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
}

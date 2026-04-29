"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Settings, Bot, Key, Webhook, Bell } from "lucide-react";

interface SettingsNavProps {
  workspaceSlug: string;
}

const navItems = [
  { label: "General", href: "/settings", icon: Settings },
  { label: "AI Configuration", href: "/settings/ai", icon: Bot },
  { label: "API Keys", href: "/settings/api-keys", icon: Key },
  { label: "Integrations", href: "/settings/integrations", icon: Webhook },
  { label: "Notifications", href: "/settings/notifications", icon: Bell },
];

export function SettingsNav({ workspaceSlug }: SettingsNavProps) {
  const pathname = usePathname();
  const base = `/${workspaceSlug}`;

  return (
    <nav className="flex gap-1 border-b pb-4 mb-6 overflow-x-auto">
      {navItems.map((item) => {
        const fullHref = `${base}${item.href}`;
        const isActive =
          pathname === fullHref ||
          (item.href !== "/settings" && pathname?.startsWith(fullHref));
        const Icon = item.icon;

        return (
          <Link key={item.href} href={fullHref}>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors whitespace-nowrap",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}

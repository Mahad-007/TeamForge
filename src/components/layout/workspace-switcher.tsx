"use client";

import { useWorkspaces } from "@/hooks/use-workspace";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronsUpDown, Plus } from "lucide-react";
import Link from "next/link";

interface WorkspaceSwitcherProps {
  currentSlug: string;
  currentName: string;
}

export function WorkspaceSwitcher({
  currentSlug,
  currentName,
}: WorkspaceSwitcherProps) {
  const { data: memberships } = useWorkspaces();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex h-auto w-full items-center justify-start gap-2 rounded-md px-2 py-1.5 text-left hover:bg-sidebar-accent">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-primary text-xs font-bold text-primary-foreground">
          {currentName.charAt(0).toUpperCase()}
        </div>
        <span className="flex-1 truncate text-sm font-semibold">
          {currentName}
        </span>
        <ChevronsUpDown className="h-4 w-4 shrink-0 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {memberships?.map((m) => {
          const ws = m.workspace as unknown as {
            slug: string;
            name: string;
          };
          return (
            <DropdownMenuItem key={ws.slug}>
              <Link
                href={`/${ws.slug}/dashboard`}
                className={
                  ws.slug === currentSlug ? "bg-accent font-medium" : ""
                }
              >
                <div className="mr-2 flex h-5 w-5 items-center justify-center rounded bg-primary/10 text-xs font-bold text-primary">
                  {ws.name.charAt(0).toUpperCase()}
                </div>
                {ws.name}
              </Link>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuItem>
          <Link href="/onboarding?new=true" className="text-muted-foreground">
            <Plus className="mr-2 h-4 w-4" />
            Create workspace
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

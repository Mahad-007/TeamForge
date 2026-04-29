"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useCommandPaletteStore } from "@/stores/command-palette";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  FolderKanban,
  CheckCircle2,
  Bug,
  MessageSquare,
  BookOpen,
  Settings,
  Plus,
  Search,
} from "lucide-react";

interface CommandPaletteProps {
  workspaceSlug: string;
  workspaceId: string;
}

export function CommandPalette({
  workspaceSlug,
  workspaceId,
}: CommandPaletteProps) {
  const router = useRouter();
  const { isOpen, close, toggle } = useCommandPaletteStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<{
    tasks?: Array<{ id: string; identifier: string; title: string }>;
    bugs?: Array<{ id: string; identifier: string; title: string }>;
  }>({});

  // Keyboard shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        toggle();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [toggle]);

  // Search
  useEffect(() => {
    if (!query || query.length < 2) {
      setResults({});
      return;
    }

    const timeout = setTimeout(async () => {
      const supabase = createClient();
      const { data } = await supabase.rpc("search_workspace", {
        ws_id: workspaceId,
        search_query: query,
        result_limit: 5,
      });

      if (data) {
        setResults(data as typeof results);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [query, workspaceId]);

  function navigate(path: string) {
    router.push(path);
    close();
    setQuery("");
  }

  const base = `/${workspaceSlug}`;

  return (
    <CommandDialog open={isOpen} onOpenChange={(open) => !open && close()}>
      <CommandInput
        placeholder="Search tasks, projects, or type a command..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>

        {/* Search results */}
        {results.tasks && results.tasks.length > 0 && (
          <CommandGroup heading="Tasks">
            {results.tasks.map((task) => (
              <CommandItem
                key={task.id}
                onSelect={() => navigate(`${base}/projects`)}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                <span className="mr-2 text-xs text-muted-foreground">
                  {task.identifier}
                </span>
                {task.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {results.bugs && results.bugs.length > 0 && (
          <CommandGroup heading="Bugs">
            {results.bugs.map((bug) => (
              <CommandItem key={bug.id}>
                <Bug className="mr-2 h-4 w-4" />
                <span className="mr-2 text-xs text-muted-foreground">
                  {bug.identifier}
                </span>
                {bug.title}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        <CommandSeparator />

        {/* Quick navigation */}
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => navigate(`${base}/dashboard`)}>
            <Search className="mr-2 h-4 w-4" />
            Dashboard
          </CommandItem>
          <CommandItem onSelect={() => navigate(`${base}/projects`)}>
            <FolderKanban className="mr-2 h-4 w-4" />
            Projects
          </CommandItem>
          <CommandItem onSelect={() => navigate(`${base}/chat`)}>
            <MessageSquare className="mr-2 h-4 w-4" />
            Chat
          </CommandItem>
          <CommandItem onSelect={() => navigate(`${base}/wiki`)}>
            <BookOpen className="mr-2 h-4 w-4" />
            Wiki
          </CommandItem>
          <CommandItem onSelect={() => navigate(`${base}/settings`)}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </CommandItem>
        </CommandGroup>

        <CommandSeparator />

        {/* Quick actions */}
        <CommandGroup heading="Actions">
          <CommandItem onSelect={() => navigate(`${base}/projects`)}>
            <Plus className="mr-2 h-4 w-4" />
            Create new project
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}

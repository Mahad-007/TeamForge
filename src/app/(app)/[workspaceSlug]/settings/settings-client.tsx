"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { SettingsNav } from "@/components/settings/settings-nav";
import { Settings, AlertTriangle } from "lucide-react";

interface Workspace {
  id: string;
  name: string;
  slug: string;
  logo_url: string | null;
  owner_id: string;
  settings: unknown;
  created_at: string | null;
}

interface SettingsClientProps {
  workspace: Workspace;
  workspaceSlug: string;
  isOwner: boolean;
}

export function SettingsClient({ workspace, workspaceSlug, isOwner }: SettingsClientProps) {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const [name, setName] = useState(workspace.name);
  const [slug, setSlug] = useState(workspace.slug);
  const [saved, setSaved] = useState(false);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("workspaces")
        .update({ name, slug })
        .eq("id", workspace.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace"] });
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);

      // If slug changed, redirect to new URL
      if (slug !== workspace.slug) {
        window.location.href = `/${slug}/settings`;
      }
    },
  });

  const hasChanges = name !== workspace.name || slug !== workspace.slug;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your workspace settings
        </p>
      </div>

      <SettingsNav workspaceSlug={workspaceSlug} />

      <Card>
        <CardContent className="pt-6 space-y-5">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Settings className="h-4.5 w-4.5 text-primary" />
            </div>
            <h2 className="font-semibold">General</h2>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ws-name">Workspace name</Label>
            <Input
              id="ws-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={!isOwner}
              placeholder="My workspace"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ws-slug">Workspace URL slug</Label>
            <Input
              id="ws-slug"
              value={slug}
              onChange={(e) =>
                setSlug(
                  e.target.value
                    .toLowerCase()
                    .replace(/[^a-z0-9-]/g, "-")
                    .replace(/-+/g, "-")
                )
              }
              disabled={!isOwner}
              placeholder="my-workspace"
            />
            <p className="text-xs text-muted-foreground">
              Your workspace will be accessible at /{slug}
            </p>
          </div>

          <div className="space-y-1.5">
            <Label>Created</Label>
            <p className="text-sm text-muted-foreground">
              {new Date(workspace.created_at ?? "").toLocaleDateString(undefined, {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>

          {isOwner && (
            <div className="flex items-center gap-2 pt-2">
              <Button
                onClick={() => updateMutation.mutate()}
                disabled={!hasChanges || updateMutation.isPending || !name.trim()}
              >
                {updateMutation.isPending ? "Saving..." : saved ? "Saved" : "Save changes"}
              </Button>
              {updateMutation.isError && (
                <p className="text-sm text-destructive">
                  {(updateMutation.error as Error).message}
                </p>
              )}
            </div>
          )}

          {!isOwner && (
            <p className="text-xs text-muted-foreground italic">
              Only the workspace owner can modify these settings.
            </p>
          )}
        </CardContent>
      </Card>

      {isOwner && (
        <>
          <Separator />
          <Card className="border-destructive/30">
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-center gap-2.5 mb-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-4.5 w-4.5 text-destructive" />
                </div>
                <h2 className="font-semibold text-destructive">Danger zone</h2>
              </div>
              <p className="text-sm text-muted-foreground">
                Deleting this workspace will permanently remove all projects,
                tasks, messages, and data. This action cannot be undone.
              </p>
              <Button variant="destructive" disabled>
                Delete workspace
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

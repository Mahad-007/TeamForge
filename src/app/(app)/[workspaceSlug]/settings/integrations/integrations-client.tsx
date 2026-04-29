"use client";

import { useState } from "react";
import {
  useWebhooks,
  useCreateWebhook,
  useUpdateWebhook,
  useDeleteWebhook,
} from "@/hooks/use-webhooks";
import { usePermissions } from "@/hooks/use-permissions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Webhook,
  Plus,
  Trash2,
  GitBranch,
  ShieldAlert,
  ExternalLink,
} from "lucide-react";
import { SettingsNav } from "@/components/settings/settings-nav";

const WEBHOOK_EVENTS = [
  { value: "task.created", label: "Task Created" },
  { value: "task.updated", label: "Task Updated" },
  { value: "task.completed", label: "Task Completed" },
  { value: "bug.created", label: "Bug Created" },
  { value: "bug.resolved", label: "Bug Resolved" },
  { value: "scan.completed", label: "Scan Completed" },
  { value: "member.joined", label: "Member Joined" },
] as const;

interface IntegrationsClientProps {
  workspaceId: string;
  workspaceSlug: string;
  workspaceSettings: Record<string, unknown> | null;
  memberId: string;
}

export function IntegrationsClient({
  workspaceId,
  workspaceSlug,
  workspaceSettings,
  memberId,
}: IntegrationsClientProps) {
  const { hasPermission, isLoading: permLoading } =
    usePermissions(workspaceId);
  const canManage = hasPermission("workspace.manage_integrations");

  const { data: webhooks, isLoading: webhooksLoading } =
    useWebhooks(workspaceId);
  const createWebhook = useCreateWebhook(workspaceId);
  const updateWebhook = useUpdateWebhook(workspaceId);
  const deleteWebhook = useDeleteWebhook(workspaceId);

  const [createOpen, setCreateOpen] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  const githubConnected =
    !!workspaceSettings?.github_installation_id ||
    !!workspaceSettings?.github_connected;

  const toggleEvent = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event)
        ? prev.filter((e) => e !== event)
        : [...prev, event]
    );
  };

  const handleCreateWebhook = async () => {
    if (!webhookUrl.trim() || selectedEvents.length === 0) return;
    await createWebhook.mutateAsync({
      url: webhookUrl.trim(),
      events: selectedEvents,
      createdBy: memberId,
    });
    setWebhookUrl("");
    setSelectedEvents([]);
    setCreateOpen(false);
  };

  if (permLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold">Integrations</h1>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
        <SettingsNav workspaceSlug={workspaceSlug} />
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold">Integrations</h1>
          <p className="text-sm text-muted-foreground">
            Manage webhooks and external service connections
          </p>
        </div>
        <SettingsNav workspaceSlug={workspaceSlug} />
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2.5 text-muted-foreground">
              <ShieldAlert className="h-5 w-5" />
              <p className="text-sm">
                You do not have permission to manage integrations.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="text-sm text-muted-foreground">
          Manage webhooks and external service connections
        </p>
      </div>

      <SettingsNav workspaceSlug={workspaceSlug} />

      {/* Webhooks Section */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                <Webhook className="h-4.5 w-4.5 text-primary" />
              </div>
              <div>
                <h2 className="font-semibold">Webhooks</h2>
                <p className="text-xs text-muted-foreground">
                  Send event notifications to external URLs
                </p>
              </div>
            </div>
            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger render={<Button size="sm" />}>
                  <Plus className="h-4 w-4 mr-1.5" />
                  Add Webhook
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Create Webhook</DialogTitle>
                  <DialogDescription>
                    Configure a URL to receive event notifications from this
                    workspace.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="webhook-url">Payload URL</Label>
                    <Input
                      id="webhook-url"
                      value={webhookUrl}
                      onChange={(e) => setWebhookUrl(e.target.value)}
                      placeholder="https://example.com/webhooks"
                      type="url"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Events</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {WEBHOOK_EVENTS.map((event) => (
                        <label
                          key={event.value}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <Checkbox
                            checked={selectedEvents.includes(event.value)}
                            onCheckedChange={() => toggleEvent(event.value)}
                          />
                          <span className="text-sm">{event.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    onClick={handleCreateWebhook}
                    disabled={
                      !webhookUrl.trim() ||
                      selectedEvents.length === 0 ||
                      createWebhook.isPending
                    }
                  >
                    {createWebhook.isPending
                      ? "Creating..."
                      : "Create webhook"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {webhooksLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !webhooks?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Webhook className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No webhooks configured</p>
              <p className="text-xs">
                Add a webhook to send event notifications to external services
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {webhooks.map((webhook) => (
                <div
                  key={webhook.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate font-mono">
                        {webhook.url}
                      </p>
                      {webhook.is_active ? (
                        <Badge variant="secondary">Active</Badge>
                      ) : (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {(webhook.events as string[])?.map((event: string) => (
                        <Badge key={event} variant="outline" className="text-xs">
                          {event}
                        </Badge>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Created{" "}
                      {new Date(webhook.created_at ?? "").toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 ml-4">
                    <Switch
                      checked={webhook.is_active ?? false}
                      onCheckedChange={(checked) =>
                        updateWebhook.mutate({
                          id: webhook.id,
                          is_active: checked as boolean,
                        })
                      }
                      size="sm"
                    />
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => deleteWebhook.mutate(webhook.id)}
                      disabled={deleteWebhook.isPending}
                      title="Delete webhook"
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Separator />

      {/* GitHub Section */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-foreground/5 dark:bg-foreground/10">
              <GitBranch className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="font-semibold">GitHub</h2>
              <p className="text-xs text-muted-foreground">
                Connect your GitHub repositories
              </p>
            </div>
          </div>

          {githubConnected ? (
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div className="flex items-center gap-2">
                <Badge variant="secondary">Connected</Badge>
                <p className="text-sm text-muted-foreground">
                  GitHub integration is active
                </p>
              </div>
              <Button variant="outline" size="sm" disabled>
                <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                Manage
              </Button>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed p-6 text-center">
              <GitBranch className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm font-medium">Not connected</p>
              <p className="text-xs text-muted-foreground mb-3">
                Connect GitHub to sync repositories, link commits to tasks, and
                enable code scanning.
              </p>
              <Button variant="outline" disabled>
                Connect GitHub (Coming Soon)
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

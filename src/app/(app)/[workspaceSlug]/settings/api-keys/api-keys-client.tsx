"use client";

import { useState } from "react";
import {
  useApiKeys,
  useCreateApiKey,
  useRevokeApiKey,
  useDeleteApiKey,
} from "@/hooks/use-api-keys";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Key, Plus, Trash2, Ban, Copy, CheckCircle } from "lucide-react";
import { SettingsNav } from "@/components/settings/settings-nav";

interface ApiKeysClientProps {
  workspaceId: string;
  workspaceSlug: string;
  memberId: string;
}

export function ApiKeysClient({ workspaceId, workspaceSlug, memberId }: ApiKeysClientProps) {
  const { data: keys, isLoading } = useApiKeys(workspaceId);
  const createMutation = useCreateApiKey(workspaceId);
  const revokeMutation = useRevokeApiKey(workspaceId);
  const deleteMutation = useDeleteApiKey(workspaceId);

  const [createOpen, setCreateOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [showKeyOpen, setShowKeyOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCreate = async () => {
    if (!keyName.trim()) return;
    const result = await createMutation.mutateAsync({
      name: keyName.trim(),
      createdBy: memberId,
    });
    setCreatedKey(result.key);
    setKeyName("");
    setCreateOpen(false);
    setShowKeyOpen(true);
  };

  const handleCopyKey = async () => {
    if (!createdKey) return;
    await navigator.clipboard.writeText(createdKey);
    setCopied(true);
    toast.success("API key copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCloseKeyDialog = () => {
    setShowKeyOpen(false);
    setCreatedKey(null);
    setCopied(false);
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">API Keys</h1>
          <p className="text-sm text-muted-foreground">
            Manage API keys for programmatic access to this workspace
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>

          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-1.5" />
              Create API Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create API Key</DialogTitle>
              <DialogDescription>
                Give your API key a descriptive name so you can identify it
                later.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-1.5 py-2">
              <Label htmlFor="key-name">Key name</Label>
              <Input
                id="key-name"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
                placeholder="e.g. CI/CD Pipeline, Mobile App"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreate();
                }}
              />
            </div>
            <DialogFooter>
              <Button
                onClick={handleCreate}
                disabled={!keyName.trim() || createMutation.isPending}
              >
                {createMutation.isPending ? "Creating..." : "Create key"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <SettingsNav workspaceSlug={workspaceSlug} />

      {/* Show created key dialog (one-time display) */}
      <Dialog open={showKeyOpen} onOpenChange={handleCloseKeyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Created</DialogTitle>
            <DialogDescription>
              Copy this key now. You will not be able to see it again.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="flex items-center gap-2">
              <code className="flex-1 rounded-md bg-muted p-3 text-xs font-mono break-all select-all">
                {createdKey}
              </code>
              <Button
                variant="outline"
                size="icon-sm"
                onClick={handleCopyKey}
              >
                {copied ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Store this key in a secure location. It will only be shown once.
            </p>
          </div>
          <DialogFooter>
            <Button onClick={handleCloseKeyDialog}>Done</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Key className="h-4.5 w-4.5 text-primary" />
            </div>
            <h2 className="font-semibold">Active Keys</h2>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full" />
              ))}
            </div>
          ) : !keys?.length ? (
            <div className="text-center py-8 text-muted-foreground">
              <Key className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No API keys yet</p>
              <p className="text-xs">
                Create a key to start using the TeamForge API
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {keys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between py-3 first:pt-0 last:pb-0"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">
                        {key.name}
                      </p>
                      {key.is_active ? (
                        <Badge variant="secondary">Active</Badge>
                      ) : (
                        <Badge variant="destructive">Revoked</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="font-mono">
                        {key.key_prefix}...
                      </span>
                      <span>
                        Created{" "}
                        {new Date(key.created_at ?? "").toLocaleDateString()}
                      </span>
                      {key.last_used_at && (
                        <span>
                          Last used{" "}
                          {new Date(key.last_used_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 ml-4">
                    {key.is_active && (
                      <Button
                        variant="outline"
                        size="icon-sm"
                        onClick={() => revokeMutation.mutate(key.id)}
                        disabled={revokeMutation.isPending}
                        title="Revoke key"
                      >
                        <Ban className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={() => deleteMutation.mutate(key.id)}
                      disabled={deleteMutation.isPending}
                      title="Delete key"
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
    </div>
  );
}

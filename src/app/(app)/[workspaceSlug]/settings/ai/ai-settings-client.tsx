"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { usePermissions } from "@/hooks/use-permissions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Bot, Eye, EyeOff, ShieldAlert } from "lucide-react";
import { SettingsNav } from "@/components/settings/settings-nav";

const AI_PROVIDERS = [
  { value: "openrouter", label: "OpenRouter" },
  { value: "claude", label: "Claude (Anthropic)" },
  { value: "openai", label: "OpenAI" },
  { value: "gemini", label: "Gemini (Google)" },
] as const;

type AiProvider = (typeof AI_PROVIDERS)[number]["value"];

interface AiSettingsClientProps {
  workspaceId: string;
  workspaceSlug: string;
  workspaceSettings: Record<string, unknown> | null;
  memberId: string | null;
}

export function AiSettingsClient({
  workspaceId,
  workspaceSlug,
  workspaceSettings,
}: AiSettingsClientProps) {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const { hasPermission, isLoading: permLoading } =
    usePermissions(workspaceId);

  const canManage = hasPermission("workspace.manage_integrations");

  const [provider, setProvider] = useState<AiProvider>(
    (workspaceSettings?.ai_provider as AiProvider) ?? "openrouter"
  );
  const [model, setModel] = useState(
    (workspaceSettings?.ai_model as string) ?? ""
  );
  const [apiKey, setApiKey] = useState(
    (workspaceSettings?.ai_api_key as string) ?? ""
  );
  const [usePlatformKey, setUsePlatformKey] = useState(
    (workspaceSettings?.use_platform_key as boolean) ?? false
  );
  const [showKey, setShowKey] = useState(false);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const newSettings = {
        ...(workspaceSettings ?? {}),
        ai_provider: provider,
        ai_model: model,
        ai_api_key: apiKey,
        use_platform_key: usePlatformKey,
      };

      const { error } = await supabase
        .from("workspaces")
        .update({ settings: newSettings })
        .eq("id", workspaceId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspace"] });
      toast.success("AI settings saved");
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  if (permLoading) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold">AI Settings</h1>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
        <SettingsNav workspaceSlug={workspaceSlug} />
      </div>
    );
  }

  if (!canManage) {
    return (
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-2xl font-bold">AI Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure AI provider and model settings
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
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold">AI Settings</h1>
        <p className="text-sm text-muted-foreground">
          Configure AI provider and model settings for this workspace
        </p>
      </div>

      <SettingsNav workspaceSlug={workspaceSlug} />

      <Card>
        <CardContent className="pt-6 space-y-5">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Bot className="h-4.5 w-4.5 text-primary" />
            </div>
            <h2 className="font-semibold">AI Configuration</h2>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ai-provider">Provider</Label>
            <Select
              value={provider}
              onValueChange={(val) => {
                if (val != null) setProvider(val as AiProvider);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a provider" />
              </SelectTrigger>
              <SelectContent>
                {AI_PROVIDERS.map((p) => (
                  <SelectItem key={p.value} value={p.value}>
                    {p.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ai-model">Model</Label>
            <Input
              id="ai-model"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g. claude-sonnet-4-20250514, gpt-4o, gemini-pro"
            />
            <p className="text-xs text-muted-foreground">
              Enter the model identifier for your selected provider
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="ai-api-key">API Key</Label>
            <div className="relative">
              <Input
                id="ai-api-key"
                type={showKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-..."
                className="pr-10"
                disabled={usePlatformKey}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                tabIndex={-1}
              >
                {showKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="use-platform-key" className="text-sm font-medium">
                Use platform key
              </Label>
              <p className="text-xs text-muted-foreground">
                Use the shared TeamForge API key instead of your own
              </p>
            </div>
            <Switch
              id="use-platform-key"
              checked={usePlatformKey}
              onCheckedChange={(checked) =>
                setUsePlatformKey(checked as boolean)
              }
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <Button
              onClick={() => updateMutation.mutate()}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving..." : "Save changes"}
            </Button>
            {updateMutation.isError && (
              <p className="text-sm text-destructive">
                {(updateMutation.error as Error).message}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

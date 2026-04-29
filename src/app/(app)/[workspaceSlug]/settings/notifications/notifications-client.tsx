"use client";

import { useState, useEffect } from "react";
import {
  useNotificationPreferences,
  useUpdateNotificationPreferences,
  DEFAULT_PREFERENCES,
  type NotificationPreferencesData,
} from "@/hooks/use-notification-preferences";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Bell, Moon } from "lucide-react";
import { SettingsNav } from "@/components/settings/settings-nav";

const NOTIFICATION_TYPES = [
  { key: "task_assigned", label: "Task assigned to you" },
  { key: "task_due_soon", label: "Task due soon" },
  { key: "task_overdue", label: "Task overdue" },
  { key: "task_status_changed", label: "Task status changed" },
  { key: "bug_assigned", label: "Bug assigned to you" },
  { key: "bug_reported", label: "New bug reported" },
  { key: "chat_mention", label: "Mentioned in chat" },
  { key: "chat_dm", label: "Direct message" },
  { key: "scan_completed", label: "Code scan completed" },
  { key: "member_joined", label: "New member joined" },
] as const;

type NotificationKey = (typeof NOTIFICATION_TYPES)[number]["key"];
type Channel = "in_app" | "email" | "push";

const HOURS = Array.from({ length: 24 }, (_, i) => ({
  value: String(i),
  label: i === 0 ? "12:00 AM" : i < 12 ? `${i}:00 AM` : i === 12 ? "12:00 PM" : `${i - 12}:00 PM`,
}));

interface NotificationsClientProps {
  userId: string;
  workspaceId: string;
  workspaceSlug: string;
}

export function NotificationsClient({
  userId,
  workspaceId,
  workspaceSlug,
}: NotificationsClientProps) {
  const { data, isLoading } = useNotificationPreferences(userId, workspaceId);
  const updateMutation = useUpdateNotificationPreferences(userId, workspaceId);

  const [preferences, setPreferences] =
    useState<NotificationPreferencesData>(DEFAULT_PREFERENCES);
  const [hasChanges, setHasChanges] = useState(false);

  // Sync from server
  useEffect(() => {
    if (data?.preferences) {
      setPreferences(data.preferences);
      setHasChanges(false);
    }
  }, [data]);

  const toggleChannel = (
    type: NotificationKey,
    channel: Channel,
    value: boolean
  ) => {
    setPreferences((prev) => ({
      ...prev,
      channels: {
        ...prev.channels,
        [type]: {
          ...prev.channels[type],
          [channel]: value,
        },
      },
    }));
    setHasChanges(true);
  };

  const toggleQuietHours = (enabled: boolean) => {
    setPreferences((prev) => ({
      ...prev,
      quiet_hours: { ...prev.quiet_hours, enabled },
    }));
    setHasChanges(true);
  };

  const setQuietHour = (field: "start_hour" | "end_hour", value: number) => {
    setPreferences((prev) => ({
      ...prev,
      quiet_hours: { ...prev.quiet_hours, [field]: value },
    }));
    setHasChanges(true);
  };

  const handleSave = () => {
    updateMutation.mutate({
      id: data?.id ?? null,
      preferences,
    });
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-2xl font-bold">Notification Preferences</h1>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
        <SettingsNav workspaceSlug={workspaceSlug} />
        <Card>
          <CardContent className="pt-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold">Notification Preferences</h1>
        <p className="text-sm text-muted-foreground">
          Choose how and when you receive notifications in this workspace
        </p>
      </div>

      <SettingsNav workspaceSlug={workspaceSlug} />

      <Card>
        <CardContent className="pt-6 space-y-5">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Bell className="h-4.5 w-4.5 text-primary" />
            </div>
            <h2 className="font-semibold">Notification Channels</h2>
          </div>

          {/* Header row */}
          <div className="grid grid-cols-[1fr_60px_60px_60px] gap-2 items-center px-1">
            <div />
            <span className="text-xs font-medium text-muted-foreground text-center">
              In-App
            </span>
            <span className="text-xs font-medium text-muted-foreground text-center">
              Email
            </span>
            <span className="text-xs font-medium text-muted-foreground text-center">
              Push
            </span>
          </div>

          <div className="divide-y">
            {NOTIFICATION_TYPES.map((type) => (
              <div
                key={type.key}
                className="grid grid-cols-[1fr_60px_60px_60px] gap-2 items-center py-2.5 px-1"
              >
                <Label className="text-sm">{type.label}</Label>
                <div className="flex justify-center">
                  <Switch
                    size="sm"
                    checked={preferences.channels[type.key]?.in_app ?? true}
                    onCheckedChange={(checked) =>
                      toggleChannel(type.key, "in_app", checked as boolean)
                    }
                  />
                </div>
                <div className="flex justify-center">
                  <Switch
                    size="sm"
                    checked={preferences.channels[type.key]?.email ?? true}
                    onCheckedChange={(checked) =>
                      toggleChannel(type.key, "email", checked as boolean)
                    }
                  />
                </div>
                <div className="flex justify-center">
                  <Switch
                    size="sm"
                    checked={preferences.channels[type.key]?.push ?? true}
                    onCheckedChange={(checked) =>
                      toggleChannel(type.key, "push", checked as boolean)
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Separator />

      <Card>
        <CardContent className="pt-6 space-y-5">
          <div className="flex items-center gap-2.5 mb-1">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
              <Moon className="h-4.5 w-4.5 text-primary" />
            </div>
            <h2 className="font-semibold">Quiet Hours</h2>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">
                Enable quiet hours
              </Label>
              <p className="text-xs text-muted-foreground">
                Pause non-critical notifications during specified hours
              </p>
            </div>
            <Switch
              checked={preferences.quiet_hours.enabled}
              onCheckedChange={(checked) =>
                toggleQuietHours(checked as boolean)
              }
            />
          </div>

          {preferences.quiet_hours.enabled && (
            <div className="grid grid-cols-2 gap-4 pl-1">
              <div className="space-y-1.5">
                <Label>Start time</Label>
                <Select
                  value={String(preferences.quiet_hours.start_hour)}
                  onValueChange={(val) => {
                    if (val != null) setQuietHour("start_hour", parseInt(val, 10));
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURS.map((h) => (
                      <SelectItem key={h.value} value={h.value}>
                        {h.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>End time</Label>
                <Select
                  value={String(preferences.quiet_hours.end_hour)}
                  onValueChange={(val) => {
                    if (val != null) setQuietHour("end_hour", parseInt(val, 10));
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HOURS.map((h) => (
                      <SelectItem key={h.value} value={h.value}>
                        {h.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center gap-2">
        <Button
          onClick={handleSave}
          disabled={!hasChanges || updateMutation.isPending}
        >
          {updateMutation.isPending ? "Saving..." : "Save preferences"}
        </Button>
        {updateMutation.isError && (
          <p className="text-sm text-destructive">
            {(updateMutation.error as Error).message}
          </p>
        )}
      </div>
    </div>
  );
}

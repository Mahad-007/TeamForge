"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { RoleDetailModal } from "@/components/roles/role-detail-modal";
import { Shield, Users, Lock } from "lucide-react";
import type { Permission } from "@/lib/permissions";

interface RolesClientProps {
  workspaceId: string;
  permissions: Record<string, boolean>;
}

const PERMISSION_GROUPS: { label: string; permissions: Permission[] }[] = [
  {
    label: "Workspace",
    permissions: [
      "workspace.manage",
      "workspace.invite",
      "workspace.remove_members",
      "workspace.manage_roles",
      "workspace.manage_billing",
      "workspace.manage_integrations",
    ],
  },
  {
    label: "Projects",
    permissions: [
      "projects.create",
      "projects.delete",
      "projects.manage",
      "projects.view_all",
    ],
  },
  {
    label: "Tasks",
    permissions: [
      "tasks.create",
      "tasks.assign",
      "tasks.delete",
      "tasks.manage_all",
      "tasks.change_status",
    ],
  },
  {
    label: "Bugs",
    permissions: [
      "bugs.create",
      "bugs.assign",
      "bugs.delete",
      "bugs.manage_all",
    ],
  },
  {
    label: "Chat",
    permissions: [
      "chat.create_channel",
      "chat.manage_channels",
      "chat.send_messages",
      "chat.delete_any_message",
    ],
  },
  {
    label: "Wiki",
    permissions: ["wiki.create", "wiki.edit_all", "wiki.delete", "wiki.manage"],
  },
  {
    label: "Code",
    permissions: [
      "code.manage_repos",
      "code.trigger_scan",
      "code.view_reports",
    ],
  },
  {
    label: "AI",
    permissions: ["ai.use_assistant", "ai.view_analytics"],
  },
];

function formatPermission(perm: string): string {
  const action = perm.split(".").pop() ?? perm;
  return action
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function countEnabledPermissions(perms: Record<string, boolean>): number {
  return Object.values(perms).filter(Boolean).length;
}

export function RolesClient({ workspaceId, permissions }: RolesClientProps) {
  const supabase = createClient();
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);

  const { data: roles, isLoading } = useQuery({
    queryKey: ["roles", workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("roles")
        .select("*")
        .eq("workspace_id", workspaceId)
        .order("position");

      if (error) throw error;
      return data;
    },
  });

  // Count members per role
  const { data: memberCounts } = useQuery({
    queryKey: ["role-member-counts", workspaceId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workspace_members")
        .select("role_id")
        .eq("workspace_id", workspaceId)
        .eq("status", "active");

      if (error) throw error;

      const counts: Record<string, number> = {};
      data.forEach((m) => {
        counts[m.role_id] = (counts[m.role_id] || 0) + 1;
      });
      return counts;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Roles</h1>
        <p className="text-sm text-muted-foreground">
          Manage roles and permissions for this workspace
        </p>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-48 rounded-lg" />
          ))}
        </div>
      ) : roles && roles.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {roles.map((role) => {
            const perms = (role.permissions ?? {}) as Record<string, boolean>;
            const enabledCount = countEnabledPermissions(perms);
            const totalCount = PERMISSION_GROUPS.reduce(
              (sum, g) => sum + g.permissions.length,
              0
            );
            const members = memberCounts?.[role.id] ?? 0;

            return (
              <Card
                key={role.id}
                className="relative overflow-hidden cursor-pointer transition-colors hover:border-primary/40"
                onClick={() => setSelectedRoleId(role.id)}
              >
                <div
                  className="absolute inset-x-0 top-0 h-1"
                  style={{ backgroundColor: role.color ?? "#6366f1" }}
                />
                <CardContent className="pt-5 pb-4 px-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="flex h-9 w-9 items-center justify-center rounded-lg"
                        style={{
                          backgroundColor: `${role.color ?? "#6366f1"}20`,
                        }}
                      >
                        <Shield
                          className="h-4.5 w-4.5"
                          style={{ color: role.color ?? "#6366f1" }}
                        />
                      </div>
                      <div>
                        <h3 className="font-semibold leading-tight">
                          {role.name}
                        </h3>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
                          <Users className="h-3 w-3" />
                          <span>
                            {members} member{members !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                    {role.is_system && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                        <Lock className="h-2.5 w-2.5 mr-0.5" />
                        System
                      </Badge>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground">
                        Permissions
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {enabledCount}/{totalCount}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {PERMISSION_GROUPS.map((group) => {
                        const groupEnabled = group.permissions.filter(
                          (p) => perms[p]
                        ).length;
                        if (groupEnabled === 0) return null;
                        return (
                          <Badge
                            key={group.label}
                            variant="outline"
                            className="text-[10px] px-1.5 py-0"
                          >
                            {group.label} ({groupEnabled}/{group.permissions.length})
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted mb-3">
            <Shield className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">No roles configured.</p>
        </div>
      )}

      {selectedRoleId && roles && (() => {
        const role = roles.find((r) => r.id === selectedRoleId);
        if (!role) return null;
        return (
          <RoleDetailModal
            open={true}
            onOpenChange={(open) => { if (!open) setSelectedRoleId(null); }}
            role={{
              id: role.id,
              name: role.name,
              color: role.color,
              permissions: (role.permissions ?? {}) as Record<string, boolean>,
              is_system: role.is_system,
              position: role.position,
            }}
            memberCount={memberCounts?.[role.id] ?? 0}
            workspaceId={workspaceId}
            canEdit={!!permissions["workspace.manage_roles"]}
            permissionGroups={PERMISSION_GROUPS}
          />
        );
      })()}
    </div>
  );
}

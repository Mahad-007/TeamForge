"use client";

import { useState, useEffect } from "react";
import { useUpdateRole } from "@/hooks/use-roles";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Shield, Users, Lock, Check } from "lucide-react";
import { toast } from "sonner";
import type { Permission } from "@/lib/permissions";

interface PermissionGroup {
  label: string;
  permissions: Permission[];
}

interface RoleDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  role: {
    id: string;
    name: string;
    color: string | null;
    permissions: Record<string, boolean>;
    is_system: boolean | null;
    position: number;
  };
  memberCount: number;
  workspaceId: string;
  canEdit: boolean;
  permissionGroups: PermissionGroup[];
}

function formatPermission(perm: string): string {
  const action = perm.split(".").pop() ?? perm;
  return action
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatGroupDescription(label: string): string {
  const descriptions: Record<string, string> = {
    Workspace: "Manage workspace settings, members, and billing",
    Projects: "Create, manage, and view projects",
    Tasks: "Create, assign, and manage tasks",
    Bugs: "Create, assign, and manage bug reports",
    Chat: "Create channels and manage messages",
    Wiki: "Create, edit, and manage wiki pages",
    Code: "Manage repositories and trigger scans",
    AI: "Use the AI assistant and view analytics",
  };
  return descriptions[label] ?? "";
}

export function RoleDetailModal({
  open,
  onOpenChange,
  role,
  memberCount,
  workspaceId,
  canEdit,
  permissionGroups,
}: RoleDetailModalProps) {
  const updateRole = useUpdateRole(workspaceId);
  const [localPerms, setLocalPerms] = useState<Record<string, boolean>>({});
  const isSystem = role.is_system === true;
  const editable = canEdit && !isSystem;

  // Sync local state when role changes
  useEffect(() => {
    setLocalPerms({ ...role.permissions });
  }, [role.id, role.permissions]);

  const hasChanges =
    JSON.stringify(localPerms) !== JSON.stringify(role.permissions);

  function togglePermission(perm: string) {
    if (!editable) return;
    setLocalPerms((prev) => ({ ...prev, [perm]: !prev[perm] }));
  }

  function toggleGroup(group: PermissionGroup) {
    if (!editable) return;
    const allEnabled = group.permissions.every((p) => localPerms[p]);
    setLocalPerms((prev) => {
      const next = { ...prev };
      group.permissions.forEach((p) => {
        next[p] = !allEnabled;
      });
      return next;
    });
  }

  function handleSave() {
    updateRole.mutate(
      { roleId: role.id, permissions: localPerms },
      {
        onSuccess: () => {
          toast.success(`Updated permissions for ${role.name}`);
          onOpenChange(false);
        },
        onError: () => toast.error("Failed to update role permissions"),
      }
    );
  }

  function handleReset() {
    setLocalPerms({ ...role.permissions });
  }

  const totalEnabled = Object.values(localPerms).filter(Boolean).length;
  const totalPerms = permissionGroups.reduce(
    (sum, g) => sum + g.permissions.length,
    0
  );
  const color = role.color ?? "#6366f1";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg"
              style={{ backgroundColor: `${color}20` }}
            >
              <Shield className="h-5 w-5" style={{ color }} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <DialogTitle>{role.name}</DialogTitle>
                {isSystem && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    <Lock className="h-2.5 w-2.5 mr-0.5" />
                    System
                  </Badge>
                )}
              </div>
              <DialogDescription className="flex items-center gap-3 mt-0.5">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {memberCount} member{memberCount !== 1 ? "s" : ""}
                </span>
                <span>
                  {totalEnabled}/{totalPerms} permissions
                </span>
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-4 px-4 max-h-[55vh]">
          <div className="space-y-5 py-2">
            {permissionGroups.map((group) => {
              const enabledInGroup = group.permissions.filter(
                (p) => localPerms[p]
              ).length;
              const allEnabled = enabledInGroup === group.permissions.length;
              const someEnabled = enabledInGroup > 0 && !allEnabled;

              return (
                <div key={group.label}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => toggleGroup(group)}
                        disabled={!editable}
                        className="flex items-center gap-2 disabled:cursor-default"
                      >
                        <h4 className="text-sm font-semibold">{group.label}</h4>
                        <Badge
                          variant={allEnabled ? "default" : someEnabled ? "secondary" : "outline"}
                          className="text-[10px] px-1.5 py-0"
                        >
                          {enabledInGroup}/{group.permissions.length}
                        </Badge>
                      </button>
                    </div>
                    {editable && (
                      <button
                        type="button"
                        onClick={() => toggleGroup(group)}
                        className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {allEnabled ? "Disable all" : "Enable all"}
                      </button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">
                    {formatGroupDescription(group.label)}
                  </p>

                  <div className="space-y-2">
                    {group.permissions.map((perm) => {
                      const enabled = !!localPerms[perm];
                      const changed = enabled !== !!role.permissions[perm];

                      return (
                        <div
                          key={perm}
                          className="flex items-center justify-between rounded-md px-3 py-2 hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm">
                              {formatPermission(perm)}
                            </span>
                            {changed && (
                              <span className="text-[10px] text-primary font-medium">
                                modified
                              </span>
                            )}
                          </div>
                          <Switch
                            checked={enabled}
                            onCheckedChange={() => togglePermission(perm)}
                            disabled={!editable}
                            size="sm"
                          />
                        </div>
                      );
                    })}
                  </div>

                  <Separator className="mt-4" />
                </div>
              );
            })}
          </div>
        </ScrollArea>

        {editable && (
          <DialogFooter>
            {hasChanges && (
              <Button variant="ghost" size="sm" onClick={handleReset}>
                Reset
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleSave}
              disabled={!hasChanges || updateRole.isPending}
            >
              {updateRole.isPending ? "Saving..." : (
                <>
                  <Check className="mr-1.5 h-3.5 w-3.5" />
                  Save changes
                </>
              )}
            </Button>
          </DialogFooter>
        )}

        {!editable && isSystem && (
          <div className="text-xs text-muted-foreground text-center py-2">
            System roles cannot be modified
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

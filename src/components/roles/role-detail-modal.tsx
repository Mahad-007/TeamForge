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

  // Only the Owner role (position 0) is truly locked. All other roles are editable.
  const isOwnerRole = role.position === 0;
  const editable = canEdit && !isOwnerRole;

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
      <DialogContent className="sm:max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-lg shrink-0"
              style={{ backgroundColor: `${color}20` }}
            >
              <Shield className="h-5 w-5" style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <DialogTitle>{role.name}</DialogTitle>
                {role.is_system && (
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
                <span>{totalEnabled}/{totalPerms} permissions enabled</span>
                {isOwnerRole && (
                  <span className="text-amber-500">Read-only</span>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="flex-1 -mx-4 px-4" style={{ maxHeight: "calc(90vh - 180px)" }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-5 py-2">
            {permissionGroups.map((group) => {
              const enabledInGroup = group.permissions.filter(
                (p) => localPerms[p]
              ).length;
              const allEnabled = enabledInGroup === group.permissions.length;
              const someEnabled = enabledInGroup > 0 && !allEnabled;

              return (
                <div
                  key={group.label}
                  className="rounded-lg border bg-card p-3"
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold">{group.label}</h4>
                      <Badge
                        variant={allEnabled ? "default" : someEnabled ? "secondary" : "outline"}
                        className="text-[10px] px-1.5 py-0"
                      >
                        {enabledInGroup}/{group.permissions.length}
                      </Badge>
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

                  <div className="space-y-1">
                    {group.permissions.map((perm) => {
                      const enabled = !!localPerms[perm];
                      const changed = enabled !== !!role.permissions[perm];

                      return (
                        <label
                          key={perm}
                          className={`flex items-center justify-between rounded-md px-2 py-1.5 transition-colors ${
                            editable ? "cursor-pointer hover:bg-muted/50" : ""
                          }`}
                        >
                          <span className="flex items-center gap-1.5 text-sm">
                            {formatPermission(perm)}
                            {changed && (
                              <span className="text-[10px] text-primary font-medium">
                                changed
                              </span>
                            )}
                          </span>
                          <Switch
                            checked={enabled}
                            onCheckedChange={() => togglePermission(perm)}
                            disabled={!editable}
                            size="sm"
                          />
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <DialogFooter>
          {isOwnerRole ? (
            <p className="text-xs text-muted-foreground mr-auto">
              The Owner role cannot be modified
            </p>
          ) : !canEdit ? (
            <p className="text-xs text-muted-foreground mr-auto">
              You need the Manage Roles permission to edit
            </p>
          ) : null}
          {editable && hasChanges && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Reset
            </Button>
          )}
          {editable && (
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
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

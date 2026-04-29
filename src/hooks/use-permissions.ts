"use client";

import { useMemo } from "react";
import { useCurrentMember } from "./use-workspace";
import { type Permission, checkPermission, checkAnyPermission } from "@/lib/permissions";
import type { Json } from "@/types/database";

export function usePermissions(workspaceId: string) {
  const { data: member, isLoading } = useCurrentMember(workspaceId);

  const permissions = useMemo(() => {
    if (!member?.role) return {} as Record<string, boolean>;
    return (member.role as { permissions: Record<string, boolean> }).permissions ?? {};
  }, [member]);

  const hasPermission = (perm: Permission): boolean => {
    return checkPermission(permissions, perm);
  };

  const hasAnyPermission = (perms: Permission[]): boolean => {
    return checkAnyPermission(permissions, perms);
  };

  const roleName = member?.role
    ? (member.role as { name: string }).name
    : null;

  const isOwner = roleName === "Owner";

  return {
    permissions,
    hasPermission,
    hasAnyPermission,
    role: member?.role ?? null,
    roleName,
    isOwner,
    isLoading,
    member,
  };
}

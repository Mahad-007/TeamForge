"use client";

import { usePermissions } from "@/hooks/use-permissions";
import type { Permission } from "@/lib/permissions";

interface PermissionGuardProps {
  workspaceId: string;
  permission: Permission;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export function PermissionGuard({
  workspaceId,
  permission,
  fallback = null,
  children,
}: PermissionGuardProps) {
  const { hasPermission, isLoading } = usePermissions(workspaceId);

  if (isLoading) return null;
  if (!hasPermission(permission)) return <>{fallback}</>;

  return <>{children}</>;
}

import { ReactNode } from 'react';
import { useActionPermissions, useIsAdmin } from '@/hooks/useAuth';

type Action = 'create' | 'read' | 'update' | 'delete';

interface PermissionGateProps {
  children: ReactNode;
  pageKey: string;
  action: Action;
  fallback?: ReactNode;
}

/**
 * Component that conditionally renders children based on action permissions.
 * Use this to show/hide buttons and UI elements based on user permissions.
 */
export function PermissionGate({ 
  children, 
  pageKey, 
  action, 
  fallback = null 
}: PermissionGateProps) {
  const { data: permissions, isLoading } = useActionPermissions(pageKey);
  
  if (isLoading) {
    return null;
  }

  const actionKey = `can_${action}` as keyof typeof permissions;
  const hasPermission = permissions?.[actionKey] ?? false;

  if (!hasPermission) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

interface AdminOnlyProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Component that only renders children for admin users
 */
export function AdminOnly({ children, fallback = null }: AdminOnlyProps) {
  const isAdmin = useIsAdmin();
  
  if (!isAdmin) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Hook to check if user can perform action
 */
export function useCanPerformAction(pageKey: string, action: Action): boolean {
  const { data: permissions } = useActionPermissions(pageKey);
  const actionKey = `can_${action}` as keyof typeof permissions;
  return permissions?.[actionKey] ?? false;
}

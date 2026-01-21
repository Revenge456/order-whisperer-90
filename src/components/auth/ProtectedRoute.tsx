import { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useSession, usePagePermissions } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: ReactNode;
  pageKey?: string;
}

export function ProtectedRoute({ children, pageKey }: ProtectedRouteProps) {
  const { user, loading: sessionLoading } = useSession();
  const { data: permissions, isLoading: permissionsLoading } = usePagePermissions();
  const location = useLocation();

  // Show loading while checking auth
  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Not logged in - redirect to auth
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // If we need to check page permissions
  if (pageKey) {
    if (permissionsLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
            <p className="text-muted-foreground">Verificando permisos...</p>
          </div>
        </div>
      );
    }

    // Check if user has access to this page
    const hasAccess = permissions?.[pageKey] ?? true;
    if (!hasAccess) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
}

export function AdminRoute({ children }: { children: ReactNode }) {
  return (
    <ProtectedRoute pageKey="team">
      {children}
    </ProtectedRoute>
  );
}

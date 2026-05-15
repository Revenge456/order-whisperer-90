import { ReactNode, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AuthBootstrapProps {
  children: ReactNode;
}

/**
 * Runs a blocking refreshSession() on first mount with a 5s timeout.
 * Centralizes the refresh so we don't call it from every useSession instance.
 * Must be mounted INSIDE ProtectedRoute (after user check) so /auth doesn't
 * suffer the latency.
 */
export function AuthBootstrap({ children }: AuthBootstrapProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await Promise.race([
          supabase.auth.refreshSession(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('refresh timeout')), 5000),
          ),
        ]);
      } catch (err: any) {
        const msg = String(err?.message || '').toLowerCase();
        if (msg.includes('auth session missing')) {
          // Normal: no session yet. Ignore.
        } else if (
          msg.includes('refresh_token') ||
          msg.includes('invalid_grant')
        ) {
          await supabase.auth.signOut();
        } else {
          console.error('[AuthBootstrap] refresh failed:', err);
        }
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

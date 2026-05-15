import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Global auth state listener. Must be invoked from a child of <BrowserRouter>
 * because it uses useNavigate().
 *
 * - TOKEN_REFRESHED: invalidate only chat-related queries (avoid refetching
 *   the entire app every hour).
 * - SIGNED_OUT: clear all queries and redirect to /auth.
 */
export function useAuthListener() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'TOKEN_REFRESHED') {
        queryClient.invalidateQueries({ queryKey: ['chat-list'] });
        queryClient.invalidateQueries({ queryKey: ['chat-messages'] });
        queryClient.invalidateQueries({ queryKey: ['chat-customers'] });
      } else if (event === 'SIGNED_OUT') {
        queryClient.clear();
        navigate('/auth', { replace: true });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, queryClient]);
}

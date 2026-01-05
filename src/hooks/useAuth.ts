import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { User, Session } from '@supabase/supabase-js';
import type { Tables, Enums } from '@/integrations/supabase/types';

type AppRole = 'admin' | 'employee';

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, user: session?.user ?? null, loading };
}

export function useUserRole() {
  const { user } = useSession();

  return useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If no role found, user might be new - treat as employee
        if (error.code === 'PGRST116') return 'employee' as AppRole;
        throw error;
      }
      
      return data.role as AppRole;
    },
    enabled: !!user,
  });
}

export function usePagePermissions() {
  const { data: role } = useUserRole();

  return useQuery({
    queryKey: ['page-permissions', role],
    queryFn: async () => {
      if (!role) return {};
      
      const { data, error } = await supabase
        .from('page_permissions')
        .select('page_key, can_access')
        .eq('role', role);

      if (error) throw error;
      
      return data.reduce((acc, { page_key, can_access }) => {
        acc[page_key] = can_access;
        return acc;
      }, {} as Record<string, boolean>);
    },
    enabled: !!role,
  });
}

export function useSignIn() {
  return useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Inicio de sesión exitoso');
    },
    onError: (error: Error) => {
      toast.error('Error: ' + error.message);
    },
  });
}

export function useSignUp() {
  return useMutation({
    mutationFn: async ({ email, password, fullName }: { 
      email: string; 
      password: string; 
      fullName: string;
    }) => {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Cuenta creada. Revisa tu email para confirmar.');
    },
    onError: (error: Error) => {
      toast.error('Error: ' + error.message);
    },
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.clear();
      toast.success('Sesión cerrada');
    },
    onError: (error: Error) => {
      toast.error('Error: ' + error.message);
    },
  });
}

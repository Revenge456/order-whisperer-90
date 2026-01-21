import { useEffect, useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { User, Session } from '@supabase/supabase-js';

type AppRole = 'admin' | 'employee';

export interface ActionPermissions {
  can_create: boolean;
  can_read: boolean;
  can_update: boolean;
  can_delete: boolean;
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  return { session, user, loading };
}

export function useUserRole() {
  const { user, loading: sessionLoading } = useSession();

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
    enabled: !!user && !sessionLoading,
  });
}

export function usePagePermissions() {
  const { data: role, isLoading: roleLoading } = useUserRole();

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
        acc[page_key] = can_access ?? false;
        return acc;
      }, {} as Record<string, boolean>);
    },
    enabled: !!role && !roleLoading,
  });
}

export function useActionPermissions(pageKey: string) {
  const { data: role, isLoading: roleLoading } = useUserRole();

  return useQuery({
    queryKey: ['action-permissions', role, pageKey],
    queryFn: async (): Promise<ActionPermissions> => {
      if (!role) return { can_create: false, can_read: false, can_update: false, can_delete: false };
      
      const { data, error } = await supabase
        .from('action_permissions')
        .select('can_create, can_read, can_update, can_delete')
        .eq('role', role)
        .eq('page_key', pageKey)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return { can_create: false, can_read: true, can_update: false, can_delete: false };
        }
        throw error;
      }
      
      return {
        can_create: data.can_create ?? false,
        can_read: data.can_read ?? true,
        can_update: data.can_update ?? false,
        can_delete: data.can_delete ?? false,
      };
    },
    enabled: !!role && !roleLoading,
  });
}

export function useIsAdmin() {
  const { data: role } = useUserRole();
  return role === 'admin';
}

export function useSignIn() {
  const queryClient = useQueryClient();

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
      queryClient.invalidateQueries({ queryKey: ['user-role'] });
      queryClient.invalidateQueries({ queryKey: ['page-permissions'] });
      queryClient.invalidateQueries({ queryKey: ['action-permissions'] });
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
      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
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

// Hook para crear usuario por parte del Admin
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      email, 
      password, 
      fullName, 
      role 
    }: { 
      email: string; 
      password: string; 
      fullName: string;
      role: AppRole;
    }) => {
      // First create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
          data: {
            full_name: fullName,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('No se pudo crear el usuario');

      // Then assign role
      const { error: roleError } = await supabase
        .from('user_roles')
        .insert({
          user_id: authData.user.id,
          role: role,
        });

      if (roleError) throw roleError;

      return authData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
      toast.success('Usuario creado exitosamente');
    },
    onError: (error: Error) => {
      toast.error('Error al crear usuario: ' + error.message);
    },
  });
}

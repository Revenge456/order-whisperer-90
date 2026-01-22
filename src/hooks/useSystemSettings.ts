import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export interface AIAgentSettings {
  enabled: boolean;
  default_for_new_customers: boolean;
}

export interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: Json;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export function useSystemSettings() {
  return useQuery({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('system_settings')
        .select('*');

      if (error) throw error;
      return data as SystemSetting[];
    },
  });
}

export function useAIAgentSettings() {
  // AI Agent is always enabled at global level
  // Only per-customer overrides are allowed
  return {
    data: { 
      enabled: true, // Always true - cannot be disabled globally
      default_for_new_customers: true 
    } as AIAgentSettings,
    isLoading: false,
    error: null,
  };
}

export function useUpdateSystemSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ key, value }: { key: string; value: Json }) => {
      const { data, error } = await supabase
        .from('system_settings')
        .update({ setting_value: value })
        .eq('setting_key', key)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      toast.success('Configuración actualizada');
    },
    onError: (error: Error) => {
      toast.error('Error al actualizar configuración: ' + error.message);
    },
  });
}

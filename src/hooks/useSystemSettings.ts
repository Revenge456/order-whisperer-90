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
  const { data: settings, ...rest } = useSystemSettings();
  
  const aiSettings = settings?.find(s => s.setting_key === 'ai_agent_mode');
  
  return {
    data: aiSettings?.setting_value as unknown as AIAgentSettings | undefined,
    settingId: aiSettings?.id,
    ...rest,
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

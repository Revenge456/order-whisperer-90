import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BroadcastCampaign {
  id: string;
  campaign_name: string;
  content_type: 'text' | 'pdf';
  message: string | null;
  pdf_url: string | null;
  pdf_name: string | null;
  status: string;
  total_contacts: number;
  sent_count: number;
  completed_at: string | null;
  created_at: string;
}

export interface BroadcastContact {
  id: string;
  campaign_id: string;
  phone: string;
  name: string | null;
  store: string | null;
  status: string;
  sent_at: string | null;
  created_at: string | null;
}

export function useCampaigns() {
  return useQuery({
    queryKey: ['broadcast-campaigns'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('broadcast_campaigns')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as BroadcastCampaign[];
    },
  });
}

export function useCampaignContacts(campaignId: string | null) {
  return useQuery({
    queryKey: ['broadcast-contacts', campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      const { data, error } = await supabase
        .from('broadcast_contacts')
        .select('*')
        .eq('campaign_id', campaignId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as BroadcastContact[];
    },
    enabled: !!campaignId,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (campaign: {
      campaign_name: string;
      content_type: 'text' | 'pdf';
      message?: string;
      pdf_url?: string;
      pdf_name?: string;
    }) => {
      const { data, error } = await supabase
        .from('broadcast_campaigns')
        .insert(campaign)
        .select()
        .single();
      if (error) throw error;
      return data as BroadcastCampaign;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broadcast-campaigns'] });
      toast.success('Campaña creada');
    },
    onError: (e: Error) => toast.error('Error: ' + e.message),
  });
}

export function useImportContacts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ campaignId, contacts }: { campaignId: string; contacts: { name?: string; phone: string; store?: string }[] }) => {
      const rows = contacts.map(c => ({
        campaign_id: campaignId,
        name: c.name || null,
        phone: c.phone,
        store: c.store || null,
      }));
      const { error } = await supabase.from('broadcast_contacts').insert(rows);
      if (error) throw error;

      const { error: updateError } = await supabase
        .from('broadcast_campaigns')
        .update({ total_contacts: contacts.length })
        .eq('id', campaignId);
      if (updateError) throw updateError;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['broadcast-contacts', vars.campaignId] });
      queryClient.invalidateQueries({ queryKey: ['broadcast-campaigns'] });
      toast.success('Contactos importados');
    },
    onError: (e: Error) => toast.error('Error al importar: ' + e.message),
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (campaignId: string) => {
      const { error } = await supabase.from('broadcast_campaigns').delete().eq('id', campaignId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broadcast-campaigns'] });
      toast.success('Campaña eliminada');
    },
    onError: (e: Error) => toast.error('Error: ' + e.message),
  });
}

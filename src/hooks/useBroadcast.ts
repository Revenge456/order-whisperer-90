import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BroadcastCampaign {
  id: string;
  name: string;
  message: string;
  status: string;
  total_contacts: number;
  sent_count: number;
  failed_count: number;
  webhook_url: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface BroadcastContact {
  id: string;
  campaign_id: string;
  name: string | null;
  phone: string;
  store: string | null;
  status: string;
  error_message: string | null;
  sent_at: string | null;
}

export interface BroadcastMedia {
  id: string;
  campaign_id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size: number | null;
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

export function useCampaignMedia(campaignId: string | null) {
  return useQuery({
    queryKey: ['broadcast-media', campaignId],
    queryFn: async () => {
      if (!campaignId) return [];
      const { data, error } = await supabase
        .from('broadcast_media')
        .select('*')
        .eq('campaign_id', campaignId);
      if (error) throw error;
      return data as BroadcastMedia[];
    },
    enabled: !!campaignId,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (campaign: { name: string; message: string; webhook_url?: string }) => {
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

      // Update total_contacts count
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

export function useUploadBroadcastMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ campaignId, file }: { campaignId: string; file: File }) => {
      const filePath = `${campaignId}/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from('broadcast-media')
        .upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('broadcast-media')
        .getPublicUrl(filePath);

      const { error: dbError } = await supabase.from('broadcast_media').insert({
        campaign_id: campaignId,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_type: file.type,
        file_size: file.size,
      });
      if (dbError) throw dbError;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['broadcast-media', vars.campaignId] });
      toast.success('Archivo subido');
    },
    onError: (e: Error) => toast.error('Error al subir: ' + e.message),
  });
}

export function useDeleteBroadcastMedia() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ mediaId, campaignId }: { mediaId: string; campaignId: string }) => {
      const { error } = await supabase.from('broadcast_media').delete().eq('id', mediaId);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['broadcast-media', vars.campaignId] });
    },
  });
}

export function useSendCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ campaignId, webhookUrl }: { campaignId: string; webhookUrl: string }) => {
      // Update campaign status
      const { error: updateError } = await supabase
        .from('broadcast_campaigns')
        .update({ status: 'sending', started_at: new Date().toISOString(), webhook_url: webhookUrl })
        .eq('id', campaignId);
      if (updateError) throw updateError;

      // Trigger n8n webhook
      await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        mode: 'no-cors',
        body: JSON.stringify({ campaign_id: campaignId }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['broadcast-campaigns'] });
      toast.success('Campaña enviada a n8n');
    },
    onError: (e: Error) => toast.error('Error: ' + e.message),
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

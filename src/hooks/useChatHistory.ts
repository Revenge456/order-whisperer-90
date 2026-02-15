import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';
import { toast } from 'sonner';

export interface ChatMessage {
  id: string;
  customer_id: string;
  content: string;
  message_type: string;
  is_automated: boolean;
  ai_agent_phase: string | null;
  created_at: string;
}

export interface ChatSummary {
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  last_message: string;
  last_message_at: string;
  message_count: number;
  chat_status: string; // 'ai' | 'revision' | 'bueno' | 'venta'
}

export type ChatFilter = 'all' | 'ai' | 'revision' | 'buenos' | 'ventas';

export function useChatList(search: string, filterStatus: ChatFilter) {
  const { data: logs, isLoading: logsLoading, error: logsError } = useQuery({
    queryKey: ['chat-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('whatsapp_logs')
        .select('id, customer_id, content, message_type, is_automated, ai_agent_phase, created_at')
        .order('created_at', { ascending: false })
        .limit(1000);
      if (error) throw error;
      return data as ChatMessage[];
    },
  });

  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ['chat-customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, phone, conversation_mode, chat_status');
      if (error) throw error;
      return data;
    },
  });

  const chatList = useMemo(() => {
    if (!logs || !customers) return [];

    const customerMap = new Map(customers.map(c => [c.id, c]));
    const grouped = new Map<string, ChatMessage[]>();

    for (const log of logs) {
      const existing = grouped.get(log.customer_id);
      if (existing) existing.push(log);
      else grouped.set(log.customer_id, [log]);
    }

    const summaries: ChatSummary[] = [];

    for (const [customerId, messages] of grouped) {
      const customer = customerMap.get(customerId);
      if (!customer) continue;

      const lastMsg = messages[0];
      summaries.push({
        customer_id: customerId,
        customer_name: customer.name || 'Sin nombre',
        customer_phone: customer.phone,
        last_message: lastMsg.content,
        last_message_at: lastMsg.created_at,
        message_count: messages.length,
        chat_status: (customer as any).chat_status || 'ai',
      });
    }

    // Apply filters
    let filtered = summaries;

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        c => c.customer_name.toLowerCase().includes(q) || c.customer_phone.includes(q)
      );
    }

    if (filterStatus === 'ai') {
      filtered = filtered.filter(c => c.chat_status === 'ai');
    } else if (filterStatus === 'revision') {
      filtered = filtered.filter(c => c.chat_status === 'revision');
    } else if (filterStatus === 'buenos') {
      filtered = filtered.filter(c => c.chat_status === 'bueno');
    } else if (filterStatus === 'ventas') {
      filtered = filtered.filter(c => c.chat_status === 'venta');
    }
    // 'all' shows everything

    return filtered.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
  }, [logs, customers, search, filterStatus]);

  return {
    data: chatList,
    isLoading: logsLoading || customersLoading,
    error: logsError,
  };
}

export function useChatMessages(customerId: string | null) {
  return useQuery({
    queryKey: ['chat-messages', customerId],
    queryFn: async () => {
      if (!customerId) return [];
      const { data, error } = await supabase
        .from('whatsapp_logs')
        .select('id, customer_id, content, message_type, is_automated, ai_agent_phase, created_at')
        .eq('customer_id', customerId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as ChatMessage[];
    },
    enabled: !!customerId,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ customerId, content }: { customerId: string; content: string }) => {
      const { error } = await supabase.from('whatsapp_logs').insert({
        customer_id: customerId,
        content,
        message_type: 'outgoing',
        is_automated: false,
        ai_agent_phase: 'manual',
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['chat-messages', variables.customerId] });
      queryClient.invalidateQueries({ queryKey: ['chat-list'] });
    },
    onError: (err: Error) => toast.error('Error al enviar: ' + err.message),
  });
}

export function useSetChatClassification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ customerId, status }: { customerId: string; status: string }) => {
      const conversationMode = status === 'ai' ? 'ai' : 'manual';
      const { error } = await supabase
        .from('customers')
        .update({ chat_status: status, conversation_mode: conversationMode })
        .eq('id', customerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chat-list'] });
      queryClient.invalidateQueries({ queryKey: ['chat-customers'] });
      toast.success('Clasificación actualizada');
    },
    onError: (err: Error) => toast.error('Error: ' + err.message),
  });
}

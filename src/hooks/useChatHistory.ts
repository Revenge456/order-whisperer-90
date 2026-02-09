import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useMemo } from 'react';

export interface ChatMessage {
  id: string;
  customer_id: string;
  content: string;
  message_type: string; // 'incoming' | 'outgoing'
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
  is_automated: boolean;
}

export function useChatList(search: string, filterStatus: 'all' | 'ai' | 'manual') {
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
        .select('id, name, phone, conversation_mode');
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

      const lastMsg = messages[0]; // already sorted desc
      summaries.push({
        customer_id: customerId,
        customer_name: customer.name || 'Sin nombre',
        customer_phone: customer.phone,
        last_message: lastMsg.content,
        last_message_at: lastMsg.created_at,
        message_count: messages.length,
        is_automated: customer.conversation_mode === 'ai',
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
      filtered = filtered.filter(c => c.is_automated);
    } else if (filterStatus === 'manual') {
      filtered = filtered.filter(c => !c.is_automated);
    }

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

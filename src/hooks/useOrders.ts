import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesUpdate, Enums } from '@/integrations/supabase/types';

type Order = Tables<'orders'>;
type OrderCompleteView = Tables<'orders_complete_view'>;
type OrderStatus = Enums<'order_status'>;
type PaymentStatus = Enums<'payment_status'>;

const BATCH_SIZE = 1000;

export function useOrders() {
  return useQuery({
    queryKey: ['orders'],
    queryFn: async () => {
      const all: OrderCompleteView[] = [];
      let offset = 0;
      while (true) {
        const { data, error } = await supabase
          .from('orders_complete_view')
          .select('*')
          .order('created_at', { ascending: false })
          .range(offset, offset + BATCH_SIZE - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;
        all.push(...(data as OrderCompleteView[]));
        if (data.length < BATCH_SIZE) break;
        offset += BATCH_SIZE;
      }
      return all;
    },
  });
}

export function useOrderItems(orderId: string | null) {
  return useQuery({
    queryKey: ['order-items', orderId],
    queryFn: async () => {
      if (!orderId) return [];
      const { data, error } = await supabase
        .from('order_items')
        .select('*')
        .eq('order_id', orderId);

      if (error) throw error;
      return data;
    },
    enabled: !!orderId,
  });
}

export function useUpdateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<'orders'> & { id: string }) => {
      const { data, error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Pedido actualizado');
    },
    onError: (error: Error) => {
      toast.error('Error: ' + error.message);
    },
  });
}

export function useUpdatePayment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<'payments'> & { id: string }) => {
      const { data, error } = await supabase
        .from('payments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['pending-payments'] });
      toast.success('Pago actualizado');
    },
    onError: (error: Error) => {
      toast.error('Error: ' + error.message);
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (orderId: string) => {
      // Delete related records first
      await supabase.from('deliveries').delete().eq('order_id', orderId);
      await supabase.from('payments').delete().eq('order_id', orderId);
      await supabase.from('order_items').delete().eq('order_id', orderId);
      
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['pending-payments'] });
      toast.success('Pedido eliminado');
    },
    onError: (error: Error) => {
      toast.error('Error: ' + error.message);
    },
  });
}

export function usePendingPayments() {
  return useQuery({
    queryKey: ['pending-payments'],
    queryFn: async () => {
      const all: any[] = [];
      let offset = 0;
      while (true) {
        const { data, error } = await supabase
          .from('pending_payments_view')
          .select('*')
          .order('created_at', { ascending: true })
          .range(offset, offset + BATCH_SIZE - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;
        all.push(...data);
        if (data.length < BATCH_SIZE) break;
        offset += BATCH_SIZE;
      }
      return all;
    },
  });
}

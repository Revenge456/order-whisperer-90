import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesUpdate, Enums } from '@/integrations/supabase/types';

type Order = Tables<'orders'>;
type OrderCompleteView = Tables<'orders_complete_view'>;
type OrderStatus = Enums<'order_status'>;
type PaymentStatus = Enums<'payment_status'>;

const BATCH_SIZE = 1000;

/** Full dataset (used by stats / dashboard). Batched to bypass 1k limit. */
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

/** Server-side paginated orders. */
export function usePaginatedOrders(params: {
  page: number;
  pageSize: number;
  search?: string;
  status?: string; // 'all' | OrderStatus
}) {
  const { page, pageSize, search = '', status = 'all' } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  return useQuery({
    queryKey: ['orders-paginated', page, pageSize, search, status],
    queryFn: async () => {
      let query = supabase
        .from('orders_complete_view')
        .select('*', { count: 'exact' });

      if (status && status !== 'all') {
        query = query.eq('status', status as OrderStatus);
      }

      const term = search.trim();
      if (term) {
        const escaped = term.replace(/[%,()]/g, ' ').trim();
        query = query.or(
          `order_number.ilike.%${escaped}%,customer_name.ilike.%${escaped}%,customer_phone.ilike.%${escaped}%`
        );
      }

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      const total = count ?? 0;
      return {
        rows: (data ?? []) as OrderCompleteView[],
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      };
    },
  });
}

/** Lightweight stats for KPI cards (counts only, no row payload). */
export function useOrderStats() {
  return useQuery({
    queryKey: ['order-stats'],
    queryFn: async () => {
      const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const [nuevos, enProceso, confirmados24h] = await Promise.all([
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'nuevo'),
        supabase
          .from('orders')
          .select('id', { count: 'exact', head: true })
          .in('status', ['confirmado', 'en_entrega']),
        supabase
          .from('orders')
          .select('id, total')
          .in('status', ['confirmado', 'completado'])
          .gte('confirmed_at', last24h),
      ]);

      const confirmadosRows = (confirmados24h.data ?? []) as Array<{ id: string; total: number | string }>;
      const confirmadosMonto = confirmadosRows.reduce(
        (sum, r) => sum + Number(r.total ?? 0),
        0,
      );

      return {
        nuevos: nuevos.count ?? 0,
        enProceso: enProceso.count ?? 0,
        confirmados24h: confirmadosRows.length,
        confirmados24hMonto: confirmadosMonto,
      };
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
      queryClient.invalidateQueries({ queryKey: ['orders-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['order-stats'] });
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
      queryClient.invalidateQueries({ queryKey: ['orders-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['pending-payments'] });
      queryClient.invalidateQueries({ queryKey: ['order-stats'] });
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
      queryClient.invalidateQueries({ queryKey: ['orders-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['pending-payments'] });
      queryClient.invalidateQueries({ queryKey: ['order-stats'] });
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

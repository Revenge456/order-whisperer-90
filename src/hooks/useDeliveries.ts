import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesUpdate, Enums } from '@/integrations/supabase/types';

type Delivery = Tables<'deliveries'>;
type DeliveryDriver = Tables<'delivery_drivers'>;
type ActiveDeliveryView = Tables<'active_deliveries_view'>;
type DeliveryStatus = Enums<'delivery_status'>;

const BATCH_SIZE = 1000;

/** Full dataset for stats. */
export function useActiveDeliveries() {
  return useQuery({
    queryKey: ['active-deliveries'],
    queryFn: async () => {
      const all: ActiveDeliveryView[] = [];
      let offset = 0;
      while (true) {
        const { data, error } = await supabase
          .from('active_deliveries_view')
          .select('*')
          .order('assigned_at', { ascending: false })
          .range(offset, offset + BATCH_SIZE - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;
        all.push(...(data as ActiveDeliveryView[]));
        if (data.length < BATCH_SIZE) break;
        offset += BATCH_SIZE;
      }
      return all;
    },
  });
}

/** Server-side paginated deliveries (active_deliveries_view). */
export function usePaginatedDeliveries(params: {
  page: number;
  pageSize: number;
  search?: string;
  status?: string; // 'all' | DeliveryStatus
}) {
  const { page, pageSize, search = '', status = 'all' } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  return useQuery({
    queryKey: ['deliveries-paginated', page, pageSize, search, status],
    queryFn: async () => {
      let query = supabase
        .from('active_deliveries_view')
        .select('*', { count: 'exact' });

      if (status && status !== 'all') {
        query = query.eq('status', status as DeliveryStatus);
      }

      const term = search.trim();
      if (term) {
        const escaped = term.replace(/[%,()]/g, ' ').trim();
        query = query.or(
          `order_number.ilike.%${escaped}%,customer_name.ilike.%${escaped}%,driver_name.ilike.%${escaped}%`
        );
      }

      const { data, error, count } = await query
        .order('assigned_at', { ascending: false })
        .range(from, to);

      if (error) throw error;
      const total = count ?? 0;
      return {
        rows: (data ?? []) as ActiveDeliveryView[],
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      };
    },
  });
}

/** Lightweight counts for KPI cards. */
export function useDeliveryCounts() {
  return useQuery({
    queryKey: ['delivery-counts'],
    queryFn: async () => {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      const [sinAsignar, enRuta, entregadosHoy] = await Promise.all([
        supabase
          .from('deliveries')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'sin_asignar'),
        supabase
          .from('deliveries')
          .select('id', { count: 'exact', head: true })
          .in('status', ['asignado', 'en_camino']),
        supabase
          .from('deliveries')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'entregado')
          .gte('delivered_at', startOfToday.toISOString()),
      ]);

      return {
        sinAsignar: sinAsignar.count ?? 0,
        enRuta: enRuta.count ?? 0,
        entregadosHoy: entregadosHoy.count ?? 0,
      };
    },
  });
}

export function useAllDeliveries() {
  return useQuery({
    queryKey: ['deliveries'],
    queryFn: async () => {
      const all: any[] = [];
      let offset = 0;
      while (true) {
        const { data, error } = await supabase
          .from('deliveries')
          .select('*, orders(order_number, total, customers(name, phone, address))')
          .order('created_at', { ascending: false })
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

export function useDeliveryDrivers() {
  return useQuery({
    queryKey: ['delivery-drivers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delivery_drivers')
        .select('*')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      return data as DeliveryDriver[];
    },
  });
}

export function useUpdateDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: TablesUpdate<'deliveries'> & { id: string }) => {
      const { data, error } = await supabase
        .from('deliveries')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['active-deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['deliveries-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['delivery-counts'] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Entrega actualizada');
    },
    onError: (error: Error) => {
      toast.error('Error: ' + error.message);
    },
  });
}

export function useAssignDriver() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ deliveryId, driverId, driverName, driverPhone }: {
      deliveryId: string;
      driverId: string;
      driverName: string;
      driverPhone: string;
    }) => {
      const { data, error } = await supabase
        .from('deliveries')
        .update({
          driver_id: driverId,
          driver_name: driverName,
          driver_phone: driverPhone,
          status: 'asignado',
          assigned_at: new Date().toISOString(),
        })
        .eq('id', deliveryId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['active-deliveries'] });
      queryClient.invalidateQueries({ queryKey: ['deliveries-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['delivery-counts'] });
      toast.success('Repartidor asignado');
    },
    onError: (error: Error) => {
      toast.error('Error: ' + error.message);
    },
  });
}

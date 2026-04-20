import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesUpdate, Enums } from '@/integrations/supabase/types';

type Delivery = Tables<'deliveries'>;
type DeliveryDriver = Tables<'delivery_drivers'>;
type ActiveDeliveryView = Tables<'active_deliveries_view'>;
type DeliveryStatus = Enums<'delivery_status'>;

const BATCH_SIZE = 1000;

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
      toast.success('Repartidor asignado');
    },
    onError: (error: Error) => {
      toast.error('Error: ' + error.message);
    },
  });
}

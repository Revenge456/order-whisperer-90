import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Customer = Tables<'customers'>;
type CustomerInsert = TablesInsert<'customers'>;
type CustomerUpdate = TablesUpdate<'customers'>;

const BATCH_SIZE = 1000;

/**
 * Fetches ALL customers in batches of 1000 to bypass PostgREST default limit.
 * Required because the customers table can grow >1000 rows.
 */
export function useCustomers() {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const all: Customer[] = [];
      let offset = 0;

      while (true) {
        const { data, error } = await supabase
          .from('customers')
          .select('*')
          .order('created_at', { ascending: false })
          .range(offset, offset + BATCH_SIZE - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;

        all.push(...(data as Customer[]));
        if (data.length < BATCH_SIZE) break;
        offset += BATCH_SIZE;
      }

      return all;
    },
  });
}

/**
 * Cheap server-side counts (total + active) — independent of paginated fetch.
 */
export function useCustomerCounts() {
  return useQuery({
    queryKey: ['customer-counts'],
    queryFn: async () => {
      const [totalRes, activeRes] = await Promise.all([
        supabase.from('customers').select('id', { count: 'exact', head: true }),
        supabase.from('customers').select('id', { count: 'exact', head: true }).eq('is_active', true),
      ]);

      if (totalRes.error) throw totalRes.error;
      if (activeRes.error) throw activeRes.error;

      return {
        total: totalRes.count ?? 0,
        active: activeRes.count ?? 0,
      };
    },
  });
}

export function useCustomerStats() {
  return useQuery({
    queryKey: ['customer-stats'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customer_stats_view')
        .select('*')
        .order('total_spent', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useCreateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (customer: CustomerInsert) => {
      const { data, error } = await supabase
        .from('customers')
        .insert(customer)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer-counts'] });
      toast.success('Cliente creado exitosamente');
    },
    onError: (error: Error) => {
      toast.error('Error al crear cliente: ' + error.message);
    },
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: CustomerUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customer-counts'] });
      toast.success('Cliente actualizado exitosamente');
    },
    onError: (error: Error) => {
      toast.error('Error al actualizar cliente: ' + error.message);
    },
  });
}

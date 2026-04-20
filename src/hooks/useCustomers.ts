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
 * Used for export-to-Excel and any consumer needing the full dataset in memory.
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

interface PaginatedCustomersParams {
  page: number;          // 1-indexed
  pageSize: number;
  search?: string;
  canal?: string;        // 'all' or specific value
}

interface PaginatedCustomersResult {
  rows: Customer[];
  total: number;
  totalPages: number;
}

/**
 * Server-side paginated customers query with search + canal filter.
 * Search is case/accent-insensitive via ilike on name and phone.
 */
export function usePaginatedCustomers({ page, pageSize, search, canal }: PaginatedCustomersParams) {
  return useQuery({
    queryKey: ['customers-paginated', page, pageSize, search ?? '', canal ?? 'all'],
    queryFn: async (): Promise<PaginatedCustomersResult> => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      let query = supabase
        .from('customers')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (canal && canal !== 'all') {
        query = query.eq('canal', canal);
      }

      const term = (search ?? '').trim();
      if (term.length > 0) {
        // Escape % and , which are special in PostgREST or() filter
        const safe = term.replace(/[%,]/g, ' ');
        query = query.or(`name.ilike.%${safe}%,phone.ilike.%${safe}%`);
      }

      const { data, error, count } = await query.range(from, to);
      if (error) throw error;

      const total = count ?? 0;
      return {
        rows: (data ?? []) as Customer[],
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      };
    },
    placeholderData: (prev) => prev,
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
      queryClient.invalidateQueries({ queryKey: ['customers-paginated'] });
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
      queryClient.invalidateQueries({ queryKey: ['customers-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['customer-counts'] });
      toast.success('Cliente actualizado exitosamente');
    },
    onError: (error: Error) => {
      toast.error('Error al actualizar cliente: ' + error.message);
    },
  });
}

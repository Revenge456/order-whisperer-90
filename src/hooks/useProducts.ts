import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

type Product = Tables<'products'>;
type ProductCategory = Tables<'product_categories'>;
type ProductInsert = TablesInsert<'products'>;
type ProductUpdate = TablesUpdate<'products'>;

const BATCH_SIZE = 1000;

/** Full dataset for stats / exports. */
export function useProducts() {
  return useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      const all: any[] = [];
      let offset = 0;
      while (true) {
        const { data, error } = await supabase
          .from('products')
          .select('*, product_categories(name)')
          .order('name')
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

/** Server-side paginated products with search + category filter. */
export function usePaginatedProducts(params: {
  page: number;
  pageSize: number;
  search?: string;
  categoryId?: string; // 'all' | uuid
}) {
  const { page, pageSize, search = '', categoryId = 'all' } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  return useQuery({
    queryKey: ['products-paginated', page, pageSize, search, categoryId],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*, product_categories(name)', { count: 'exact' });

      if (categoryId && categoryId !== 'all') {
        query = query.eq('category_id', categoryId);
      }

      const term = search.trim();
      if (term) {
        const escaped = term.replace(/[%,()]/g, ' ').trim();
        query = query.or(`name.ilike.%${escaped}%,description.ilike.%${escaped}%`);
      }

      const { data, error, count } = await query
        .order('name')
        .range(from, to);

      if (error) throw error;
      const total = count ?? 0;
      return {
        rows: (data ?? []) as any[],
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      };
    },
  });
}

/** Lightweight counts for KPI cards. */
export function useProductCounts() {
  return useQuery({
    queryKey: ['product-counts'],
    queryFn: async () => {
      const [total, active, outOfStock] = await Promise.all([
        supabase.from('products').select('id', { count: 'exact', head: true }),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('products').select('id', { count: 'exact', head: true }).eq('stock', 0),
      ]);
      return {
        total: total.count ?? 0,
        active: active.count ?? 0,
        outOfStock: outOfStock.count ?? 0,
      };
    },
  });
}

export function useLowStockProducts() {
  return useQuery({
    queryKey: ['low-stock-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('low_stock_products_view')
        .select('*');

      if (error) throw error;
      return data;
    },
  });
}

export function useProductCategories() {
  return useQuery({
    queryKey: ['product-categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data as ProductCategory[];
    },
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (product: ProductInsert) => {
      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['product-counts'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-products'] });
      toast.success('Producto creado exitosamente');
    },
    onError: (error: Error) => {
      toast.error('Error al crear producto: ' + error.message);
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: ProductUpdate & { id: string }) => {
      const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['product-counts'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-products'] });
      toast.success('Producto actualizado exitosamente');
    },
    onError: (error: Error) => {
      toast.error('Error al actualizar producto: ' + error.message);
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['products-paginated'] });
      queryClient.invalidateQueries({ queryKey: ['product-counts'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock-products'] });
      toast.success('Producto eliminado exitosamente');
    },
    onError: (error: Error) => {
      toast.error('Error al eliminar producto: ' + error.message);
    },
  });
}

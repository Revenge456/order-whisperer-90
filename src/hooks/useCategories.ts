import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

export type Category = Tables<'product_categories'>;
export type CategoryWithCount = Category & { product_count: number };

const CATEGORIES_KEY = ['categories-with-count'] as const;

function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: CATEGORIES_KEY });
  qc.invalidateQueries({ queryKey: ['product-categories'] });
  qc.invalidateQueries({ queryKey: ['products'] });
}

export function useCategoriesWithCount() {
  return useQuery({
    queryKey: CATEGORIES_KEY,
    queryFn: async (): Promise<CategoryWithCount[]> => {
      const { data: cats, error } = await supabase
        .from('product_categories')
        .select('*')
        .order('name');
      if (error) throw error;

      const { data: products, error: pErr } = await supabase
        .from('products')
        .select('category_id');
      if (pErr) throw pErr;

      const counts = new Map<string, number>();
      for (const p of products ?? []) {
        if (!p.category_id) continue;
        counts.set(p.category_id, (counts.get(p.category_id) ?? 0) + 1);
      }

      return (cats ?? []).map((c) => ({
        ...c,
        product_count: counts.get(c.id) ?? 0,
      }));
    },
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; description?: string | null; is_active: boolean }) => {
      const name = input.name.trim();
      if (!name) throw new Error('El nombre es requerido');

      // Client-side uniqueness check (case-insensitive)
      const { data: existing, error: chkErr } = await supabase
        .from('product_categories')
        .select('id, name')
        .ilike('name', name);
      if (chkErr) throw chkErr;
      if ((existing ?? []).length > 0) {
        throw new Error(`Ya existe una categoría con el nombre "${name}"`);
      }

      const payload: TablesInsert<'product_categories'> = {
        name,
        description: input.description?.trim() || null,
        is_active: input.is_active,
      };
      const { data, error } = await supabase
        .from('product_categories')
        .insert(payload)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidateAll(qc),
  });
}

export function useUpdateCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; name: string; description?: string | null; is_active: boolean }) => {
      const name = input.name.trim();
      if (!name) throw new Error('El nombre es requerido');

      const { data: existing, error: chkErr } = await supabase
        .from('product_categories')
        .select('id, name')
        .ilike('name', name)
        .neq('id', input.id);
      if (chkErr) throw chkErr;
      if ((existing ?? []).length > 0) {
        throw new Error(`Ya existe otra categoría con el nombre "${name}"`);
      }

      const payload: TablesUpdate<'product_categories'> = {
        name,
        description: input.description?.trim() || null,
        is_active: input.is_active,
      };
      const { data, error } = await supabase
        .from('product_categories')
        .update(payload)
        .eq('id', input.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidateAll(qc),
  });
}

export function useToggleCategoryActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; is_active: boolean }) => {
      const { data, error } = await supabase
        .from('product_categories')
        .update({ is_active: input.is_active })
        .eq('id', input.id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => invalidateAll(qc),
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('product_categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => invalidateAll(qc),
  });
}

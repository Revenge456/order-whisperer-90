import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { Json } from '@/integrations/supabase/types';

export type ColumnType = 
  | 'text' 
  | 'number' 
  | 'date' 
  | 'boolean' 
  | 'select' 
  | 'multi_select' 
  | 'status' 
  | 'email' 
  | 'phone' 
  | 'file' 
  | 'url';

export interface ColumnOption {
  value: string;
  label: string;
  color?: string;
}

export interface ColumnDefinition {
  id: string;
  module_key: string;
  column_key: string;
  column_name: string;
  column_type: ColumnType;
  is_system: boolean;
  is_visible: boolean;
  is_required: boolean;
  column_order: number;
  column_width: number | null;
  options: ColumnOption[] | null;
  default_value: string | null;
  created_at: string;
  updated_at: string;
}

export type ModuleKey = 'customers' | 'orders' | 'deliveries' | 'products';

// Helper to convert DB response to ColumnDefinition
function parseColumnDefinition(row: Record<string, unknown>): ColumnDefinition {
  return {
    ...row,
    options: row.options ? (row.options as ColumnOption[]) : null,
  } as ColumnDefinition;
}

export function useColumnDefinitions(moduleKey: ModuleKey) {
  return useQuery({
    queryKey: ['column-definitions', moduleKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('table_column_definitions')
        .select('*')
        .eq('module_key', moduleKey)
        .order('column_order', { ascending: true });

      if (error) throw error;
      return (data || []).map(parseColumnDefinition);
    },
  });
}

export function useVisibleColumns(moduleKey: ModuleKey) {
  const { data: columns, ...rest } = useColumnDefinitions(moduleKey);
  return {
    data: columns?.filter(col => col.is_visible),
    ...rest,
  };
}

export function useCreateColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (column: Omit<ColumnDefinition, 'id' | 'created_at' | 'updated_at'>) => {
      const dbColumn = {
        ...column,
        options: column.options as unknown as Json,
      };

      const { data, error } = await supabase
        .from('table_column_definitions')
        .insert(dbColumn)
        .select()
        .single();

      if (error) throw error;
      return parseColumnDefinition(data as Record<string, unknown>);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['column-definitions', data.module_key] });
      toast.success('Columna creada exitosamente');
    },
    onError: (error: Error) => {
      toast.error('Error al crear columna: ' + error.message);
    },
  });
}

export function useUpdateColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ColumnDefinition> & { id: string }) => {
      const dbUpdates: Record<string, unknown> = { ...updates };
      if (updates.options !== undefined) {
        dbUpdates.options = updates.options as unknown as Json;
      }

      const { data, error } = await supabase
        .from('table_column_definitions')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return parseColumnDefinition(data as Record<string, unknown>);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['column-definitions', data.module_key] });
      toast.success('Columna actualizada');
    },
    onError: (error: Error) => {
      toast.error('Error al actualizar columna: ' + error.message);
    },
  });
}

export function useDeleteColumn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, moduleKey }: { id: string; moduleKey: string }) => {
      const { error } = await supabase
        .from('table_column_definitions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, moduleKey };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['column-definitions', data.moduleKey] });
      toast.success('Columna eliminada');
    },
    onError: (error: Error) => {
      toast.error('Error al eliminar columna: ' + error.message);
    },
  });
}

export function useReorderColumns() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ columns, moduleKey }: { columns: { id: string; column_order: number }[]; moduleKey: string }) => {
      const updates = columns.map(col => 
        supabase
          .from('table_column_definitions')
          .update({ column_order: col.column_order })
          .eq('id', col.id)
      );

      const results = await Promise.all(updates);
      const errors = results.filter(r => r.error);
      if (errors.length > 0) throw new Error('Error reordering columns');

      return { moduleKey };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['column-definitions', data.moduleKey] });
    },
    onError: (error: Error) => {
      toast.error('Error al reordenar columnas: ' + error.message);
    },
  });
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const SUCURSALES_BUCKET = 'Canal 1';

export interface Sucursal {
  id: number;
  nombre: string;
  descripcion: string | null;
  direccion: string | null;
  photo_urls: string[];
  aliases: string[];
  coming_soon: boolean;
  is_active: boolean;
  sort_order: number;
}

export type SucursalFormData = Omit<Sucursal, 'id'>;

export function useSucursales() {
  return useQuery({
    queryKey: ['sucursales'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('sucursales')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('nombre', { ascending: true });
      if (error) throw error;
      return (data as Sucursal[]).map(s => ({
        ...s,
        photo_urls: s.photo_urls || [],
        aliases: s.aliases || [],
        coming_soon: s.coming_soon ?? false,
        is_active: s.is_active ?? true,
        sort_order: s.sort_order ?? 0,
      }));
    },
  });
}

export function useCreateSucursal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: SucursalFormData) => {
      const { error } = await (supabase as any)
        .from('sucursales')
        .insert({
          nombre: data.nombre,
          descripcion: data.descripcion || null,
          photo_urls: data.photo_urls,
          aliases: data.aliases,
          coming_soon: data.coming_soon,
          is_active: data.is_active,
          sort_order: data.sort_order,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sucursales'] });
      toast.success('Sucursal creada');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useUpdateSucursal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: Partial<Sucursal> & { id: number }) => {
      const { error } = await (supabase as any)
        .from('sucursales')
        .update(data)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sucursales'] });
      toast.success('Sucursal actualizada');
    },
    onError: (e: any) => toast.error(e.message),
  });
}

export function useDeleteSucursalPhoto() {
  return useMutation({
    mutationFn: async (url: string) => {
      // Extract path from public URL
      const match = url.match(/\/storage\/v1\/object\/public\/(.+)/);
      if (match) {
        const fullPath = decodeURIComponent(match[1]);
        const bucketEnd = fullPath.indexOf('/');
        const bucket = fullPath.substring(0, bucketEnd);
        const path = fullPath.substring(bucketEnd + 1);
        await supabase.storage.from(bucket).remove([path]);
      }
    },
    onError: (e: any) => toast.error('Error al borrar foto: ' + e.message),
  });
}

function extractStoragePath(url: string, bucket: string): string | null {
  const match = url.match(/\/storage\/v1\/object\/public\/(.+)/);
  if (!match) return null;
  const fullPath = decodeURIComponent(match[1]);
  const prefix = bucket + '/';
  if (!fullPath.startsWith(prefix)) return null;
  return fullPath.substring(prefix.length);
}

export function useDeleteSucursal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, photo_urls }: { id: number; photo_urls: string[] }) => {
      // a) Try to delete photos first (best-effort)
      const paths = (photo_urls || [])
        .map((u) => extractStoragePath(u, SUCURSALES_BUCKET))
        .filter((p): p is string => !!p);
      if (paths.length) {
        try {
          const { error: storageErr } = await supabase.storage
            .from(SUCURSALES_BUCKET)
            .remove(paths);
          if (storageErr) {
            console.warn('[deleteSucursal] storage cleanup failed:', storageErr.message);
          }
        } catch (e) {
          console.warn('[deleteSucursal] storage cleanup threw:', e);
        }
      }
      // b) Delete row — surface real error
      const { error } = await (supabase as any)
        .from('sucursales')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sucursales'] });
      toast.success('Sucursal eliminada');
    },
    onError: (e: any) => toast.error('No se pudo eliminar: ' + (e?.message || 'error desconocido')),
  });
}

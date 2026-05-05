import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { X, Upload, GripVertical } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDeleteSucursalPhoto } from '@/hooks/useSucursales';

interface Props {
  value: string[];
  onChange: (v: string[]) => void;
  slug: string;
}

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 3 * 1024 * 1024;

function slugify(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

export function SucursalPhotoManager({ value, onChange, slug }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const deletePhoto = useDeleteSucursalPhoto();

  const upload = useCallback(async (files: FileList | File[]) => {
    const validFiles = Array.from(files).filter(f => {
      if (!ALLOWED.includes(f.type)) { toast.error(`Tipo no permitido: ${f.name}`); return false; }
      if (f.size > MAX_SIZE) { toast.error(`Archivo muy grande: ${f.name} (max 3MB)`); return false; }
      return true;
    });
    if (!validFiles.length) return;

    setUploading(true);
    const newUrls: string[] = [];
    const s = slugify(slug || 'sin-nombre');

    for (const file of validFiles) {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `Ubicaciones Sucursales/${s}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from('Canal 1').upload(path, file);
      if (error) {
        toast.error(`Error subiendo ${file.name}: ${error.message}`);
        continue;
      }
      const { data: pub } = supabase.storage.from('Canal 1').getPublicUrl(path);
      newUrls.push(pub.publicUrl);
    }

    if (newUrls.length) onChange([...value, ...newUrls]);
    setUploading(false);
  }, [slug, value, onChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
  }, [upload]);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    await deletePhoto.mutateAsync(deleteTarget);
    onChange(value.filter(u => u !== deleteTarget));
    setDeleteTarget(null);
    toast.success('Foto eliminada');
  };

  const handleDragStart = (idx: number) => setDragIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const newUrls = [...value];
    const [moved] = newUrls.splice(dragIdx, 1);
    newUrls.splice(idx, 0, moved);
    onChange(newUrls);
    setDragIdx(idx);
  };

  return (
    <div className="space-y-3">
      <div
        className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
      >
        <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
        <p className="text-sm text-muted-foreground">
          {uploading ? 'Subiendo...' : 'Arrastrá fotos o hacé click para subir'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">JPG, PNG, WebP — máx 3MB</p>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => e.target.files && upload(e.target.files)}
        />
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {value.map((url, idx) => (
            <div
              key={url}
              className="relative group rounded-md overflow-hidden border border-border"
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={() => setDragIdx(null)}
            >
              <img src={url} alt="" className="w-full aspect-square object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1">
                <GripVertical className="h-4 w-4 text-white cursor-grab" />
                <button
                  type="button"
                  onClick={() => setDeleteTarget(url)}
                  className="p-1 rounded-full bg-destructive/80 hover:bg-destructive"
                >
                  <X className="h-3 w-3 text-white" />
                </button>
              </div>
              <span className="absolute bottom-1 left-1 text-[10px] text-white bg-black/60 px-1 rounded">
                {idx + 1}
              </span>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar esta foto?</AlertDialogTitle>
            <AlertDialogDescription>Se borrará del Storage y de la sucursal. Esta acción no se puede deshacer.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

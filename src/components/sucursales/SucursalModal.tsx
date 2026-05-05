import { useState, useEffect, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { SucursalAliasesInput } from './SucursalAliasesInput';
import { SucursalPhotoManager } from './SucursalPhotoManager';
import { WhatsAppPreview } from './WhatsAppPreview';
import { useCreateSucursal, useUpdateSucursal } from '@/hooks/useSucursales';
import type { Sucursal } from '@/hooks/useSucursales';
import { AlertTriangle } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sucursal?: Sucursal | null;
}

const empty = {
  nombre: '',
  descripcion: '',
  photo_urls: [] as string[],
  aliases: [] as string[],
  coming_soon: false,
  is_active: true,
  sort_order: 0,
};

export function SucursalModal({ open, onOpenChange, sucursal }: Props) {
  const [form, setForm] = useState(empty);
  const create = useCreateSucursal();
  const update = useUpdateSucursal();
  const isEdit = !!sucursal;

  useEffect(() => {
    if (sucursal) {
      setForm({
        nombre: sucursal.nombre,
        descripcion: sucursal.descripcion || '',
        photo_urls: sucursal.photo_urls || [],
        aliases: sucursal.aliases || [],
        coming_soon: sucursal.coming_soon,
        is_active: sucursal.is_active,
        sort_order: sucursal.sort_order,
      });
    } else {
      setForm(empty);
    }
  }, [sucursal, open]);

  const asteriskWarning = useMemo(() => {
    const count = (form.descripcion.match(/\*/g) || []).length;
    return count % 2 !== 0;
  }, [form.descripcion]);

  const handleSubmit = async () => {
    if (!form.nombre.trim()) return;
    const payload = {
      ...form,
      nombre: form.nombre.trim(),
      descripcion: form.descripcion || null,
    };
    if (isEdit) {
      await update.mutateAsync({ id: sucursal!.id, ...payload });
    } else {
      await create.mutateAsync(payload as any);
    }
    onOpenChange(false);
  };

  const saving = create.isPending || update.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Editar sucursal' : 'Nueva sucursal'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Nombre */}
          <div className="space-y-1.5">
            <Label>Nombre *</Label>
            <Input value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Santa Cruz" />
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <Label>Descripción (WhatsApp)</Label>
            <Textarea
              rows={10}
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
              placeholder="Texto con formato WhatsApp: *negrita*, emojis, links..."
            />
            {asteriskWarning && (
              <p className="text-xs text-yellow-500 flex items-center gap-1">
                <AlertTriangle className="h-3 w-3" />
                Número impar de asteriscos — el formato bold de WhatsApp podría verse roto
              </p>
            )}
          </div>

          {/* Aliases */}
          <div className="space-y-1.5">
            <Label>Aliases (palabras clave del bot)</Label>
            <SucursalAliasesInput value={form.aliases} onChange={(v) => setForm({ ...form, aliases: v })} />
          </div>

          {/* Photos */}
          <div className="space-y-1.5">
            <Label>Fotos</Label>
            <SucursalPhotoManager
              value={form.photo_urls}
              onChange={(v) => setForm({ ...form, photo_urls: v })}
              slug={form.nombre}
            />
          </div>

          {/* Switches row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <Switch checked={form.coming_soon} onCheckedChange={(v) => setForm({ ...form, coming_soon: v })} />
              <div>
                <Label>Próximamente</Label>
                <p className="text-xs text-muted-foreground">El bot dirá "abrimos pronto" sin enviar fotos</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm({ ...form, is_active: v })} />
              <div>
                <Label>Activa</Label>
                <p className="text-xs text-muted-foreground">Si está OFF, el bot no la menciona</p>
              </div>
            </div>
          </div>

          {/* Sort order */}
          <div className="space-y-1.5 max-w-[120px]">
            <Label>Orden</Label>
            <Input
              type="number"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: parseInt(e.target.value) || 0 })}
            />
          </div>

          {/* WhatsApp Preview */}
          <WhatsAppPreview descripcion={form.descripcion} photoUrls={form.photo_urls} nombre={form.nombre || 'Sucursal'} />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={saving || !form.nombre.trim()}>
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear sucursal'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

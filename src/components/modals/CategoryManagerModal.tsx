import { useState } from 'react';
import { Plus, Pencil, Trash2, Tag } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useCategoriesWithCount,
  useCreateCategory,
  useUpdateCategory,
  useToggleCategoryActive,
  useDeleteCategory,
  type CategoryWithCount,
} from '@/hooks/useCategories';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type FormState = {
  id: string | null;
  name: string;
  description: string;
  is_active: boolean;
};

const emptyForm: FormState = { id: null, name: '', description: '', is_active: true };

export function CategoryManagerModal({ open, onOpenChange }: Props) {
  const { data: categories, isLoading } = useCategoriesWithCount();
  const createMut = useCreateCategory();
  const updateMut = useUpdateCategory();
  const toggleMut = useToggleCategoryActive();
  const deleteMut = useDeleteCategory();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [confirmDelete, setConfirmDelete] = useState<CategoryWithCount | null>(null);

  const closeForm = () => {
    setShowForm(false);
    setForm(emptyForm);
  };

  const openCreate = () => {
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (cat: CategoryWithCount) => {
    setForm({
      id: cat.id,
      name: cat.name,
      description: cat.description ?? '',
      is_active: cat.is_active ?? true,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (form.id) {
        await updateMut.mutateAsync({
          id: form.id,
          name: form.name,
          description: form.description,
          is_active: form.is_active,
        });
        toast.success('Categoría actualizada');
      } else {
        await createMut.mutateAsync({
          name: form.name,
          description: form.description,
          is_active: form.is_active,
        });
        toast.success('Categoría creada');
      }
      closeForm();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al guardar');
    }
  };

  const handleToggle = async (cat: CategoryWithCount) => {
    try {
      await toggleMut.mutateAsync({ id: cat.id, is_active: !(cat.is_active ?? true) });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await deleteMut.mutateAsync(confirmDelete.id);
      toast.success('Categoría eliminada');
      setConfirmDelete(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'No se pudo eliminar');
    }
  };

  const saving = createMut.isPending || updateMut.isPending;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" /> Gestionar categorías
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-sm text-muted-foreground">
                {categories?.length ?? 0} categoría(s) en total
              </p>
              {!showForm && (
                <Button size="sm" onClick={openCreate}>
                  <Plus className="w-4 h-4 mr-1" /> Nueva categoría
                </Button>
              )}
            </div>

            {showForm && (
              <form onSubmit={handleSubmit} className="border border-border rounded-lg p-4 space-y-3 bg-secondary/30">
                <div className="grid gap-2">
                  <Label htmlFor="cat-name">Nombre *</Label>
                  <Input
                    id="cat-name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Ej: Proteínas"
                    maxLength={80}
                    required
                    autoFocus
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="cat-desc">Descripción</Label>
                  <Textarea
                    id="cat-desc"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Opcional"
                    rows={2}
                    maxLength={300}
                  />
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="cat-active"
                    checked={form.is_active}
                    onCheckedChange={(v) => setForm({ ...form, is_active: v })}
                  />
                  <Label htmlFor="cat-active">Activa (visible para el bot)</Label>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="ghost" onClick={closeForm} disabled={saving}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving || !form.name.trim()}>
                    {saving ? 'Guardando...' : form.id ? 'Guardar cambios' : 'Crear categoría'}
                  </Button>
                </div>
              </form>
            )}

            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-center">Productos</TableHead>
                    <TableHead className="text-center">Activa</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                      <TableRow key={i}>
                        <TableCell colSpan={5}><Skeleton className="h-6 w-full" /></TableCell>
                      </TableRow>
                    ))
                  ) : (categories?.length ?? 0) === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-6">
                        No hay categorías. Creá la primera con "+ Nueva categoría".
                      </TableCell>
                    </TableRow>
                  ) : (
                    categories!.map((cat) => {
                      const count = cat.product_count;
                      const canDelete = count === 0;
                      return (
                        <TableRow key={cat.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {cat.name}
                              {count === 0 && (
                                <Badge variant="outline" className="border-warning/40 text-warning text-xs">
                                  Vacía
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-xs truncate">
                            {cat.description || '—'}
                          </TableCell>
                          <TableCell className="text-center tabular-nums">{count}</TableCell>
                          <TableCell className="text-center">
                            <Switch
                              checked={cat.is_active ?? true}
                              onCheckedChange={() => handleToggle(cat)}
                              disabled={toggleMut.isPending}
                            />
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => openEdit(cat)}
                                aria-label="Editar"
                              >
                                <Pencil className="w-4 h-4" />
                              </Button>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="text-destructive hover:text-destructive hover:bg-destructive/10 disabled:opacity-40"
                                        disabled={!canDelete}
                                        onClick={() => setConfirmDelete(cat)}
                                        aria-label="Eliminar"
                                      >
                                        <Trash2 className="w-4 h-4" />
                                      </Button>
                                    </span>
                                  </TooltipTrigger>
                                  {!canDelete && (
                                    <TooltipContent>
                                      No se puede eliminar: {count} producto(s) asignado(s). Reasigná o eliminá los productos primero.
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cerrar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar categoría {confirmDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer y borrará la categoría permanentemente de la base de datos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMut.isPending}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteMut.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMut.isPending ? 'Eliminando...' : 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

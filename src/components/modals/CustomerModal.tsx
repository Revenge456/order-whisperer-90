import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Loader2 } from 'lucide-react';
import { useCreateCustomer, useUpdateCustomer } from '@/hooks/useCustomers';
import { CustomFieldsManager } from '@/components/ui/custom-fields';
import type { Tables } from '@/integrations/supabase/types';

type Customer = Tables<'customers'>;

interface CustomerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
}

export function CustomerModal({ open, onOpenChange, customer }: CustomerModalProps) {
  const isEditing = !!customer;
  const createCustomer = useCreateCustomer();
  const updateCustomer = useUpdateCustomer();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    notes: '',
    is_active: true,
    custom_fields: {} as Record<string, string | number | boolean>,
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name || '',
        phone: customer.phone || '',
        address: customer.address || '',
        notes: customer.notes || '',
        is_active: customer.is_active ?? true,
        custom_fields: (customer as any).custom_fields || {},
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        address: '',
        notes: '',
        is_active: true,
        custom_fields: {},
      });
    }
  }, [customer, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.phone.trim()) {
      return;
    }

    try {
      if (isEditing && customer) {
        await updateCustomer.mutateAsync({
          id: customer.id,
          ...formData,
        });
      } else {
        await createCustomer.mutateAsync(formData);
      }
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const isLoading = createCustomer.isPending || updateCustomer.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? 'Actualiza la información del cliente'
                : 'Ingresa los datos del nuevo cliente'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nombre completo"
                className="bg-input border-border"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="phone">Teléfono *</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+591 70000000"
                required
                className="bg-input border-border"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="address">Dirección</Label>
              <Textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Dirección de entrega"
                className="bg-input border-border min-h-[80px]"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Notas</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Observaciones adicionales"
                className="bg-input border-border min-h-[60px]"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Cliente Activo</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
            </div>

            <Separator className="bg-border" />

            <CustomFieldsManager
              fields={formData.custom_fields}
              onChange={(fields) => setFormData(prev => ({ ...prev, custom_fields: fields }))}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
              className="border-border"
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Guardar Cambios' : 'Crear Cliente'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { useCreateProduct, useUpdateProduct, useProductCategories } from '@/hooks/useProducts';
import type { Tables } from '@/integrations/supabase/types';

type Product = Tables<'products'>;

interface ProductModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: Product | null;
}

export function ProductModal({ open, onOpenChange, product }: ProductModalProps) {
  const isEditing = !!product;
  const createProduct = useCreateProduct();
  const updateProduct = useUpdateProduct();
  const { data: categories } = useProductCategories();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '',
    low_stock_threshold: '5',
    category_id: '',
    is_active: true,
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        price: product.price?.toString() || '',
        stock: product.stock?.toString() || '0',
        low_stock_threshold: product.low_stock_threshold?.toString() || '5',
        category_id: product.category_id || '',
        is_active: product.is_active ?? true,
      });
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        stock: '',
        low_stock_threshold: '5',
        category_id: '',
        is_active: true,
      });
    }
  }, [product, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim() || !formData.price) {
      return;
    }

    const productData = {
      name: formData.name,
      description: formData.description || null,
      price: parseFloat(formData.price),
      stock: parseInt(formData.stock) || 0,
      low_stock_threshold: parseInt(formData.low_stock_threshold) || 5,
      category_id: formData.category_id || null,
      is_active: formData.is_active,
    };

    try {
      if (isEditing && product) {
        await updateProduct.mutateAsync({
          id: product.id,
          ...productData,
        });
      } else {
        await createProduct.mutateAsync(productData);
      }
      onOpenChange(false);
    } catch (error) {
      // Error is handled by the mutation
    }
  };

  const isLoading = createProduct.isPending || updateProduct.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
            </DialogTitle>
            <DialogDescription>
              {isEditing 
                ? 'Actualiza la información del producto'
                : 'Ingresa los datos del nuevo producto'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nombre *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Nombre del producto"
                required
                className="bg-secondary/50"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="category">Categoría</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, category_id: value }))}
              >
                <SelectTrigger className="bg-secondary/50">
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descripción del producto"
                className="bg-secondary/50 min-h-[80px]"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="price">Precio (Bs.) *</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                  placeholder="0.00"
                  required
                  className="bg-secondary/50"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="stock">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                  placeholder="0"
                  className="bg-secondary/50"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="low_stock_threshold">Alerta de Stock Mínimo</Label>
              <Input
                id="low_stock_threshold"
                type="number"
                min="0"
                value={formData.low_stock_threshold}
                onChange={(e) => setFormData(prev => ({ ...prev, low_stock_threshold: e.target.value }))}
                placeholder="5"
                className="bg-secondary/50"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Producto Activo</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Guardar Cambios' : 'Crear Producto'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

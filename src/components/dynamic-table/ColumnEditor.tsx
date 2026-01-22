import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { 
  useCreateColumn, 
  useUpdateColumn, 
  type ColumnDefinition, 
  type ColumnType, 
  type ColumnOption,
  type ModuleKey 
} from '@/hooks/useColumnDefinitions';
import { COLUMN_TYPE_LABELS } from './types';

interface ColumnEditorProps {
  column?: ColumnDefinition;
  moduleKey: ModuleKey;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  existingColumnKeys: string[];
  nextOrder: number;
}

const OPTION_COLORS = ['primary', 'success', 'warning', 'destructive', 'muted'];

export function ColumnEditor({ 
  column, 
  moduleKey, 
  open, 
  onOpenChange, 
  existingColumnKeys,
  nextOrder 
}: ColumnEditorProps) {
  const isEditing = !!column;
  const createColumn = useCreateColumn();
  const updateColumn = useUpdateColumn();
  const isPending = createColumn.isPending || updateColumn.isPending;

  const [formData, setFormData] = useState({
    column_name: '',
    column_key: '',
    column_type: 'text' as ColumnType,
    is_required: false,
    options: [] as ColumnOption[],
    default_value: '',
  });

  const [newOption, setNewOption] = useState({ value: '', label: '', color: 'muted' });

  useEffect(() => {
    if (open) {
      if (column) {
        setFormData({
          column_name: column.column_name,
          column_key: column.column_key,
          column_type: column.column_type,
          is_required: column.is_required,
          options: column.options || [],
          default_value: column.default_value || '',
        });
      } else {
        setFormData({
          column_name: '',
          column_key: '',
          column_type: 'text',
          is_required: false,
          options: [],
          default_value: '',
        });
      }
      setNewOption({ value: '', label: '', color: 'muted' });
    }
  }, [open, column]);

  // Auto-generate key from name
  const handleNameChange = (name: string) => {
    setFormData(prev => ({
      ...prev,
      column_name: name,
      column_key: isEditing ? prev.column_key : name.toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, ''),
    }));
  };

  const handleAddOption = () => {
    if (!newOption.label.trim()) return;
    
    const optionValue = newOption.value.trim() || newOption.label.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '_');

    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { ...newOption, value: optionValue }],
    }));
    setNewOption({ value: '', label: '', color: 'muted' });
  };

  const handleRemoveOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.column_name.trim() || !formData.column_key.trim()) return;
    
    // Check for duplicate keys
    if (!isEditing && existingColumnKeys.includes(formData.column_key)) {
      return;
    }

    const columnData = {
      module_key: moduleKey,
      column_key: formData.column_key,
      column_name: formData.column_name,
      column_type: formData.column_type,
      is_required: formData.is_required,
      is_system: false,
      is_visible: true,
      column_order: column?.column_order ?? nextOrder,
      column_width: null,
      options: ['select', 'multi_select', 'status'].includes(formData.column_type) 
        ? formData.options 
        : null,
      default_value: formData.default_value || null,
    };

    try {
      if (isEditing && column) {
        await updateColumn.mutateAsync({ id: column.id, ...columnData });
      } else {
        await createColumn.mutateAsync(columnData);
      }
      onOpenChange(false);
    } catch {
      // Error handled by mutation
    }
  };

  const showOptionsEditor = ['select', 'multi_select', 'status'].includes(formData.column_type);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Columna' : 'Nueva Columna'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modifica las propiedades de la columna.'
              : 'Agrega una nueva columna a la tabla.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="column_name">Nombre</Label>
              <Input
                id="column_name"
                value={formData.column_name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ej: Fecha de Cumpleaños"
                disabled={column?.is_system}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="column_key">Clave</Label>
              <Input
                id="column_key"
                value={formData.column_key}
                onChange={(e) => setFormData(prev => ({ ...prev, column_key: e.target.value }))}
                placeholder="fecha_cumpleanos"
                disabled={isEditing}
                className="font-mono text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Dato</Label>
              <Select
                value={formData.column_type}
                onValueChange={(v) => setFormData(prev => ({ ...prev, column_type: v as ColumnType }))}
                disabled={column?.is_system}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(COLUMN_TYPE_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="default_value">Valor por Defecto</Label>
              <Input
                id="default_value"
                value={formData.default_value}
                onChange={(e) => setFormData(prev => ({ ...prev, default_value: e.target.value }))}
                placeholder="Opcional"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label htmlFor="is_required">Campo Obligatorio</Label>
            <Switch
              id="is_required"
              checked={formData.is_required}
              onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_required: checked }))}
            />
          </div>

          {showOptionsEditor && (
            <div className="space-y-3 border border-border rounded-lg p-4">
              <Label>Opciones</Label>
              
              <div className="flex flex-wrap gap-2">
                {formData.options.map((opt, index) => (
                  <Badge 
                    key={index} 
                    variant="outline" 
                    className="gap-1 pr-1"
                  >
                    <span 
                      className="w-2 h-2 rounded-full" 
                      style={{ 
                        backgroundColor: `hsl(var(--${opt.color}))` 
                      }} 
                    />
                    {opt.label}
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className="ml-1 hover:bg-muted rounded p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Etiqueta"
                  value={newOption.label}
                  onChange={(e) => setNewOption(prev => ({ ...prev, label: e.target.value }))}
                  className="flex-1"
                />
                <Select
                  value={newOption.color}
                  onValueChange={(v) => setNewOption(prev => ({ ...prev, color: v }))}
                >
                  <SelectTrigger className="w-[120px]">
                    <div className="flex items-center gap-2">
                      <span 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: `hsl(var(--${newOption.color}))` }} 
                      />
                      Color
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {OPTION_COLORS.map(color => (
                      <SelectItem key={color} value={color}>
                        <div className="flex items-center gap-2">
                          <span 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: `hsl(var(--${color}))` }} 
                          />
                          {color}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="button" size="icon" onClick={handleAddOption}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isPending || !formData.column_name.trim()}>
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Guardando...
                </>
              ) : isEditing ? 'Guardar Cambios' : 'Crear Columna'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
